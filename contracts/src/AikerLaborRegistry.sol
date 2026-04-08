// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AikerLaborRegistry {
    enum TaskStatus {
        None,
        Created,
        Completed,
        Cancelled
    }

    struct Agent {
        address creator;
        address payoutAddress;
        uint256 price;
        uint256 completedTasks;
        string name;
        string category;
        string description;
        string apiEndpoint;
        string network;
        string traits;
        bool active;
        uint64 createdAt;
    }

    struct Task {
        uint256 agentId;
        address creator;
        address worker;
        uint256 price;
        bytes32 taskSpecHash;
        bytes32 resultHash;
        bytes32 olasJobId;
        string proofCid;
        TaskStatus status;
        uint64 createdAt;
        uint64 completedAt;
    }

    error InvalidAddress();
    error InvalidFee();
    error InvalidTask();
    error InvalidStatus();
    error InvalidAgent();
    error Unauthorized();
    error TransferFailed();

    event AgentRegistered(
        uint256 indexed agentId,
        address indexed creator,
        address indexed payoutAddress,
        string name,
        string category,
        uint256 price,
        string network
    );
    event AgentStatusUpdated(uint256 indexed agentId, bool active);
    event TaskCreated(
        uint256 indexed taskId,
        uint256 indexed agentId,
        address indexed creator,
        address worker,
        uint256 price,
        bytes32 taskSpecHash
    );
    event TaskCompleted(
        uint256 indexed taskId,
        uint256 indexed agentId,
        string proofCid,
        bytes32 resultHash,
        bytes32 indexed olasJobId,
        uint256 workerPayout,
        uint256 protocolFee
    );
    event TaskCancelled(uint256 indexed taskId, uint256 indexed agentId);
    event FeeRecipientUpdated(address indexed feeRecipient);
    event ProtocolFeeUpdated(uint96 feeBps);
    event OperatorUpdated(address indexed operator, bool allowed);

    uint96 public protocolFeeBps;
    uint256 public nextAgentId = 1;
    uint256 public nextTaskId = 1;
    address public owner;
    address public feeRecipient;

    mapping(address => bool) public operators;
    mapping(uint256 => Agent) private agents;
    mapping(uint256 => Task) private tasks;

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    constructor(address _feeRecipient, uint96 _protocolFeeBps) {
        if (_feeRecipient == address(0)) revert InvalidAddress();
        if (_protocolFeeBps > 1_000) revert InvalidFee();

        owner = msg.sender;
        feeRecipient = _feeRecipient;
        protocolFeeBps = _protocolFeeBps;
    }

    function registerAgent(
        string calldata name,
        string calldata category,
        string calldata description,
        string calldata apiEndpoint,
        address payoutAddress,
        uint256 price,
        string calldata network,
        string calldata traits
    ) external returns (uint256 agentId) {
        if (bytes(name).length == 0) revert InvalidAgent();
        if (payoutAddress == address(0)) revert InvalidAddress();
        if (price == 0) revert InvalidFee();

        agentId = nextAgentId++;
        Agent storage agent = agents[agentId];
        agent.creator = msg.sender;
        agent.payoutAddress = payoutAddress;
        agent.price = price;
        agent.completedTasks = 0;
        agent.name = name;
        agent.category = category;
        agent.description = description;
        agent.apiEndpoint = apiEndpoint;
        agent.network = network;
        agent.traits = traits;
        agent.active = true;
        agent.createdAt = uint64(block.timestamp);

        emit AgentRegistered(agentId, msg.sender, payoutAddress, name, category, price, network);
    }

    function setAgentActive(uint256 agentId, bool active) external {
        Agent storage agent = agents[agentId];
        if (agent.creator == address(0)) revert InvalidAgent();
        if (msg.sender != agent.creator && msg.sender != owner) revert Unauthorized();
        agent.active = active;
        emit AgentStatusUpdated(agentId, active);
    }

    function createTask(uint256 agentId, bytes32 taskSpecHash) external payable returns (uint256 taskId) {
        Agent storage agent = agents[agentId];
        if (agent.creator == address(0) || !agent.active) revert InvalidAgent();
        if (msg.value != agent.price) revert InvalidFee();

        taskId = nextTaskId++;
        tasks[taskId] = Task({
            agentId: agentId,
            creator: msg.sender,
            worker: agent.payoutAddress,
            price: msg.value,
            taskSpecHash: taskSpecHash,
            resultHash: bytes32(0),
            olasJobId: bytes32(0),
            proofCid: "",
            status: TaskStatus.Created,
            createdAt: uint64(block.timestamp),
            completedAt: 0
        });

        emit TaskCreated(taskId, agentId, msg.sender, agent.payoutAddress, msg.value, taskSpecHash);
    }

    function completeTask(
        uint256 taskId,
        string calldata proofCid,
        bytes32 resultHash,
        bytes32 olasJobId
    ) external {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.Created) revert InvalidStatus();

        Agent storage agent = agents[task.agentId];
        bool isAllowed =
            msg.sender == task.creator || msg.sender == task.worker || msg.sender == agent.creator || operators[msg.sender] || msg.sender == owner;
        if (!isAllowed) revert Unauthorized();

        task.status = TaskStatus.Completed;
        task.proofCid = proofCid;
        task.resultHash = resultHash;
        task.olasJobId = olasJobId;
        task.completedAt = uint64(block.timestamp);
        agent.completedTasks += 1;

        uint256 protocolFee = (task.price * protocolFeeBps) / 10_000;
        uint256 workerPayout = task.price - protocolFee;

        _sendValue(task.worker, workerPayout);
        if (protocolFee > 0) {
            _sendValue(feeRecipient, protocolFee);
        }

        emit TaskCompleted(taskId, task.agentId, proofCid, resultHash, olasJobId, workerPayout, protocolFee);
    }

    function cancelTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        if (task.status != TaskStatus.Created) revert InvalidStatus();
        if (msg.sender != task.creator && msg.sender != owner) revert Unauthorized();

        task.status = TaskStatus.Cancelled;
        task.completedAt = uint64(block.timestamp);
        _sendValue(task.creator, task.price);

        emit TaskCancelled(taskId, task.agentId);
    }

    function setOperator(address operator, bool allowed) external onlyOwner {
        if (operator == address(0)) revert InvalidAddress();
        operators[operator] = allowed;
        emit OperatorUpdated(operator, allowed);
    }

    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        if (newFeeRecipient == address(0)) revert InvalidAddress();
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(newFeeRecipient);
    }

    function setProtocolFeeBps(uint96 newFeeBps) external onlyOwner {
        if (newFeeBps > 1_000) revert InvalidFee();
        protocolFeeBps = newFeeBps;
        emit ProtocolFeeUpdated(newFeeBps);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        Agent memory agent = agents[agentId];
        if (agent.creator == address(0)) revert InvalidAgent();
        return agent;
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        Task memory task = tasks[taskId];
        if (task.status == TaskStatus.None) revert InvalidTask();
        return task;
    }

    function _onlyOwner() internal view {
        if (msg.sender != owner) revert Unauthorized();
    }

    function _sendValue(address recipient, uint256 amount) private {
        (bool success,) = payable(recipient).call{value: amount}("");
        if (!success) revert TransferFailed();
    }
}
