import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PORT = Number(process.env.AIKER_AGENT_PORT || 8787);

const loadEnvFile = () => {
    const envPath = resolve(process.cwd(), '.env');
    if (!existsSync(envPath)) return;

    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();

        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
};

loadEnvFile();

const json = (res, statusCode, payload) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(payload));
};

const summarizeOutput = (output) => {
    const trimmed = output.trim();
    if (!trimmed) return '';

    const sentence = trimmed.split(/(?<=[.!?])\s+/)[0];
    return sentence.length > 240 ? `${sentence.slice(0, 237)}...` : sentence;
};

const getProviderConfig = () => {
    if (process.env.GROQ_API_KEY) {
        return {
            provider: 'groq',
            apiKey: process.env.GROQ_API_KEY,
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        };
    }

    if (process.env.GEMINI_API_KEY) {
        return {
            provider: 'gemini',
            apiKey: process.env.GEMINI_API_KEY,
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        };
    }

    return null;
};

const parseAttachment = (attachment) => {
    if (!attachment?.dataUrl) return null;
    const match = String(attachment.dataUrl).match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;

    const [, mimeType, data] = match;
    return {
        inlineData: {
            mimeType,
            data,
        },
    };
};

const buildPrompt = (payload) => {
    const agentName = payload?.agent?.name || 'Aiker Agent';
    const agentDescription = payload?.agent?.description || 'Specialized research and analysis worker';
    const objective = payload?.task?.objective || '';
    const context = payload?.task?.context || 'No extra context provided.';
    const requestedOutput = payload?.task?.requestedOutput || 'Research Report';
    const urls = Array.isArray(payload?.task?.urls) && payload.task.urls.length > 0
        ? payload.task.urls.map((url, index) => `${index + 1}. ${url}`).join('\n')
        : 'No URLs provided.';
    const conversation = Array.isArray(payload?.conversation) && payload.conversation.length > 0
        ? payload.conversation
            .map((message) => `${message?.role === 'assistant' ? 'Assistant' : 'User'}: ${message?.content || ''}`)
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

const extractGeminiText = (payload) => {
    const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
    const text = candidates
        .flatMap((candidate) => candidate?.content?.parts ?? [])
        .map((part) => (typeof part?.text === 'string' ? part.text : ''))
        .join('\n')
        .trim();

    if (!text) {
        throw new Error('Gemini returned an empty response.');
    }

    return text;
};

const extractGroqText = (payload) => {
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
        throw new Error('Groq returned an empty response.');
    }

    return text.trim();
};

const server = createServer(async (req, res) => {
    if (!req.url) {
        json(res, 404, { error: 'Missing URL.' });
        return;
    }

    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
    }

    if (req.url !== '/api/aiker/execute') {
        json(res, 404, { error: 'Route not found.' });
        return;
    }

    if (req.method !== 'POST') {
        json(res, 405, { error: 'Method not allowed. Use POST.' });
        return;
    }

    const providerConfig = getProviderConfig();

    if (!providerConfig) {
        json(res, 500, { error: 'No model provider is configured. Add GROQ_API_KEY or GEMINI_API_KEY.' });
        return;
    }

    let body = '';
    req.on('data', (chunk) => {
        body += chunk;
    });

    req.on('end', async () => {
        try {
            const payload = body ? JSON.parse(body) : {};

            if (payload?.protocol !== 'aiker.agent-job.v1') {
                json(res, 400, { error: 'Unsupported protocol. Expected aiker.agent-job.v1.' });
                return;
            }

            if (!payload?.task?.objective?.trim()) {
                json(res, 400, { error: 'Task objective is required.' });
                return;
            }

            const parts = [{ text: buildPrompt(payload) }];
            const attachments = Array.isArray(payload?.task?.attachments) ? payload.task.attachments : [];
            for (const attachment of attachments) {
                const part = parseAttachment(attachment);
                if (part) parts.push(part);
            }

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

                        json(res, 502, {
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

                        json(res, 502, {
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

            let parsed;
            try {
                parsed = JSON.parse(rawText);
            } catch {
                parsed = { output: rawText };
            }

            const output = parsed?.output?.trim();
            if (!output) {
                json(res, 500, { error: 'Gemini response did not include output text.' });
                return;
            }

            const sources = Array.isArray(parsed?.sources) && parsed.sources.length > 0
                ? parsed.sources
                : (Array.isArray(payload?.task?.urls) ? payload.task.urls : []);

            json(res, 200, {
                output,
                summary: parsed?.summary?.trim?.() || summarizeOutput(output),
                sources,
                metadata: {
                    provider: providerConfig.provider,
                    model: providerConfig.model,
                    attachmentCount: attachments.length,
                    urlCount: Array.isArray(payload?.task?.urls) ? payload.task.urls.length : 0,
                    requestedAt: payload?.requestedAt || null,
                    localDev: true,
                },
            });
        } catch (error) {
            json(res, 500, {
                error: error instanceof Error ? error.message : 'Agent execution failed.',
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Aiker local agent server listening on http://localhost:${PORT}/api/aiker/execute`);
});
