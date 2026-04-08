#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Agent {
    pub id: u32,
    pub owner: Address,
    pub name: Symbol,
    pub endpoint: Symbol,
    pub price: u128,
    pub asset_type: Symbol, // e.g., Symbol::new(&env, "XLM") or "USDC"
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TaskRecord {
    pub task_id: u32,
    pub agent_id: u32,
    pub hirer: Address,
    pub timestamp: u64,
}

#[contract]
pub struct AikerRegistry;

#[contractimpl]
impl AikerRegistry {
    // Initialize the registry
    pub fn init(env: Env) {
        env.storage().instance().set(&symbol_short!("next_id"), &1u32);
        env.storage().instance().set(&symbol_short!("next_t"), &1u32);
    }

    // Register a new agent
    pub fn register_agent(env: Env, owner: Address, name: Symbol, endpoint: Symbol, price: u128, asset_type: Symbol) -> u32 {
        owner.require_auth();
        
        let id: u32 = env.storage().instance().get(&symbol_short!("next_id")).unwrap_or(1);
        
        let agent = Agent {
            id,
            owner: owner.clone(),
            name,
            endpoint,
            price,
            asset_type,
        };

        env.storage().instance().set(&id, &agent);
        env.storage().instance().set(&symbol_short!("next_id"), &(id + 1));
        
        id
    }

    // Get agent details
    pub fn get_agent(env: Env, id: u32) -> Option<Agent> {
        env.storage().instance().get(&id)
    }

    // Record a completed task (settlement proof)
    pub fn record_task(env: Env, hirer: Address, agent_id: u32) -> u32 {
        hirer.require_auth();
        
        let task_id: u32 = env.storage().instance().get(&symbol_short!("next_t")).unwrap_or(1);
        
        let record = TaskRecord {
            task_id,
            agent_id,
            hirer,
            timestamp: env.ledger().timestamp(),
        };

        env.storage().instance().set(&Symbol::new(&env, "task"), &record); // Simplified for demo
        env.storage().instance().set(&symbol_short!("next_t"), &(task_id + 1));
        
        task_id
    }
}
