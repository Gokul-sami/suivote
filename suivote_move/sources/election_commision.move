module suivote_move::election_commission {
    // use sui::tx_context::{Self, TxContext};
    // use sui::object::{Self, UID};
    // use sui::transfer;
    // use sui::tx_context::TxContext;
    // use sui::std;

    use suivote_move::vote::Voter;
    use suivote_move::vote::{is_verified, has_voted, mark_as_voted, set_verified};

    //storing the EC address
    public struct Config has key {
        id: UID,
        ec_address: address,
        admin: address,
    }

    //Initialize the config 
    public fun init_config(ec_address: address, ctx: &mut TxContext, config: &mut Config) {
        let sender = ctx.sender();
        assert!(!(config.admin==sender), 100);

        let config = Config {
            id: object::new(ctx),
            ec_address,
            admin: sender,
        };

        transfer::transfer(config, sender);
    }

    // Update the EC address — only admin allowed
    public fun update_ec_address(new_address: address, ctx: &TxContext, config: &mut Config) {
        let sender = ctx.sender();
        // let config = borrow_global_mut<Config>(sender);
        assert!(sender == config.admin, 101);

        config.ec_address = new_address;
    }

    // EC-only: Verify voter
    public fun verify_voter(voter: &mut Voter, ctx: &TxContext, config: &mut Config) {
        // let config = borrow_global<Config>(ctx.sender());
        assert!(ctx.sender() == config.ec_address, 200);
        set_verified(voter, true);
    }

    /// EC-only: Mark voter as voted
    public fun mark_voted(voter: &mut Voter, ctx: &TxContext, config: &mut Config) {
        // let config = borrow_global<Config>(ctx.sender());
        assert!(ctx.sender() == config.ec_address, 201);
        assert!(is_verified(voter), 202);
        assert!(!has_voted(voter), 203);
        mark_as_voted(voter);
    }
}
