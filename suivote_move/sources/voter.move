module suivote_move::vote {
    // use sui::object::{Self, UID};
    // use sui::tx_context::{Self, TxContext};
    // use std::string::{Self, String};
    use std::string::String;


    public struct Voter has key {
        id: UID,
        did: String,
        verified: bool,
        voted: bool,
    }

    public fun create_voter(did: String, ctx: &mut TxContext): Voter {
        Voter {
            id: object::new(ctx),
            did,
            verified: false,
            voted: false,
        }
    }

    public fun is_verified(voter: &Voter): bool {
        voter.verified
    }

    public fun has_voted(voter: &Voter): bool {
        voter.voted
    }

    public fun mark_as_voted(voter: &mut Voter) {
        voter.voted = true;
    }
    
    public fun set_verified(voter: &mut Voter, value: bool) {
        voter.verified = value;
    }


}
