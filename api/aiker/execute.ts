type AikerAttachment = {
    name?: string;
    type?: string;
    size?: number;
    dataUrl?: string;
};

type AikerTask = {
    objective?: string;
    context?: string;
    requestedOutput?: string;
    urls?: string[];
    attachments?: AikerAttachment[];
};

type AikerRequest = {
    protocol?: string;
    agent?: {
        id?: number;
        name?: string;
        description?: string;
        endpoint?: string;
        price?: string;
    };
    task?: AikerTask;
    conversation?: Array<{ role?: string; content?: string }>;
    requestedAt?: string;
};

type GeminiPart =
    | { text: string }
    | {
        inlineData: {
            mimeType: string;
            data: string;
        };
    };

type VercelRequest = {
    method?: string;
    body?: unknown;
};

type VercelResponse = {
    status: (code: number) => VercelResponse;
    json: (body: unknown) => void;
    setHeader: (name: string, value: string) => void;
    end: () => void;
};

const withCors = (res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const parseAttachment = (attachment: AikerAttachment): GeminiPart | null => {
    if (!attachment.dataUrl) return null;

    const match = attachment.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;

    const [, mimeType, data] = match;
    return {
        inlineData: {
            mimeType,
            data,
        },
    };
};

const summarizeOutput = (output: string) => {
    const trimmed = output.trim();
    if (!trimmed) return '';

    const sentence = trimmed.split(/(?<=[.!?])\s+/)[0];
    return sentence.length > 240 ? `${sentence.slice(0, 237)}...` : sentence;
};

const getProviderConfig = () => {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
        return {
            provider: 'groq',
            apiKey: groqApiKey,
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        } as const;
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
        return {
            provider: 'gemini',
            apiKey: geminiApiKey,
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        } as const;
    }

    return null;
};

const buildPrompt = (payload: AikerRequest) => {
    const agentName = payload.agent?.name || 'Aiker Agent';
    const agentDescription = payload.agent?.description || 'Specialized research and analysis worker';
    const objective = payload.task?.objective || '';
    const context = payload.task?.context || 'No extra context provided.';
    const requestedOutput = payload.task?.requestedOutput || 'Research Report';
    const urls = payload.task?.urls?.length
        ? payload.task.urls.map((url, index) => `${index + 1}. ${url}`).join('\n')
        : 'No URLs provided.';
    const conversation = Array.isArray(payload.conversation) && payload.conversation.length > 0
        ? payload.conversation
            .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content || ''}`)
            .join('\n\n')
        : 'No prior conversation.';

    return [
        `You are ${agentName}, a competitive autonomous worker in the Aiker marketplace.`,
        `Your specialization: ${agentDescription}.`,
        `Produce a high-quality ${requestedOutput} for the client.`,
        '',
        'Client objective:',
        objective,
        '',
        'Additional context:',
        context,
        '',
        'Reference URLs:',
        urls,
        '',
        'Task conversation so far:',
        conversation,
        '',
        'Return JSON with this shape:',
        '{',
        '  "output": "full final deliverable as markdown/plain text",',
        '  "summary": "one short summary sentence",',
        '  "sources": ["url or source note"]',
        '}',
        '',
        'If attachments are included, use them as primary evidence.',
        'Do not wrap the JSON in markdown fences.',
    ].join('\n');
};

const extractGeminiText = (payload: any): string => {
    const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
    const text = candidates
        .flatMap((candidate: any) => candidate?.content?.parts ?? [])
        .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
        .join('\n')
        .trim();

    if (!text) {
        throw new Error('Gemini returned an empty response.');
    }

    return text;
};

const extractGroqText = (payload: any): string => {
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
        throw new Error('Groq returned an empty response.');
    }

    return text.trim();
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    withCors(res);

    if (req.method === 'OPTIONS') {
        res.status(200);
        res.end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }

    const providerConfig = getProviderConfig();

    if (!providerConfig) {
        res.status(500).json({ error: 'No model provider is configured. Add GROQ_API_KEY or GEMINI_API_KEY on the server.' });
        return;
    }

    const payload = (req.body || {}) as AikerRequest;
    if (payload.protocol !== 'aiker.agent-job.v1') {
        res.status(400).json({ error: 'Unsupported protocol. Expected aiker.agent-job.v1.' });
        return;
    }

    if (!payload.task?.objective?.trim()) {
        res.status(400).json({ error: 'Task objective is required.' });
        return;
    }

    try {
        const parts: GeminiPart[] = [{ text: buildPrompt(payload) }];
        const attachmentParts = (payload.task.attachments || [])
            .map(parseAttachment)
            .filter((part): part is GeminiPart => part !== null);

        parts.push(...attachmentParts);

        const rawText = providerConfig.provider === 'groq'
            ? await (async () => {
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${providerConfig.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: providerConfig.model,
                        temperature: 0.4,
                        response_format: { type: 'json_object' },
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a competitive Aiker marketplace worker. Return only valid JSON.',
                            },
                            {
                                role: 'user',
                                content: buildPrompt(payload),
                            },
                        ],
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    let friendlyError = `Groq request failed (${response.status}).`;

                    if (response.status === 429) {
                        friendlyError = 'Groq quota or rate limit exceeded for this agent endpoint. Switch key, wait, or use another model.';
                    } else if (response.status === 401 || response.status === 403) {
                        friendlyError = 'Groq rejected this agent endpoint. Check that GROQ_API_KEY is valid and permitted.';
                    }

                    res.status(502).json({
                        error: friendlyError,
                        details: errorText,
                    });
                    return null;
                }

                const groqPayload = await response.json();
                return extractGroqText(groqPayload);
            })()
            : await (async () => {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(providerConfig.model)}:generateContent?key=${encodeURIComponent(providerConfig.apiKey)}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    role: 'user',
                                    parts,
                                },
                            ],
                            generationConfig: {
                                temperature: 0.4,
                                responseMimeType: 'application/json',
                            },
                        }),
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    let friendlyError = `Gemini request failed (${response.status}).`;

                    if (response.status === 429) {
                        friendlyError = 'Gemini quota exceeded for this agent endpoint. Check billing, quota, or switch to a different key/model.';
                    } else if (response.status === 401 || response.status === 403) {
                        friendlyError = 'Gemini rejected this agent endpoint. Check that GEMINI_API_KEY is valid and permitted for the selected model.';
                    }

                    res.status(502).json({
                        error: friendlyError,
                        details: errorText,
                    });
                    return null;
                }

                const geminiPayload = await response.json();
                return extractGeminiText(geminiPayload);
            })();

        if (!rawText) {
            return;
        }

        let parsed: { output?: string; summary?: string; sources?: string[] };
        try {
            parsed = JSON.parse(rawText);
        } catch {
            parsed = { output: rawText };
        }

        const output = parsed.output?.trim();
        if (!output) {
            throw new Error('Gemini response did not include output text.');
        }

        const sources = Array.isArray(parsed.sources) && parsed.sources.length > 0
            ? parsed.sources
            : (payload.task.urls || []);

        res.status(200).json({
            output,
            summary: parsed.summary?.trim() || summarizeOutput(output),
            sources,
            metadata: {
                provider: providerConfig.provider,
                model: providerConfig.model,
                attachmentCount: payload.task.attachments?.length || 0,
                urlCount: payload.task.urls?.length || 0,
                requestedAt: payload.requestedAt || null,
            },
        });
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Agent execution failed.',
        });
    }
}
