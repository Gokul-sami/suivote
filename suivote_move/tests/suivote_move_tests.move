/*
#[test_only]
module suivote_move::suivote_move_tests;
// uncomment this line to import the module
// use suivote_move::suivote_move;

const ENotImplemented: u64 = 0;

#[test]
fun test_suivote_move() {
    // pass
}

#[test, expected_failure(abort_code = ::suivote_move::suivote_move_tests::ENotImplemented)]
fun test_suivote_move_fail() {
    abort ENotImplemented
}
*/

module tests::vote_test {
    use std::string::utf8;
    use tests::vote_test;
    use suivote_move::vote::{Self, Voter, create_voter, is_verified, has_voted, mark_as_voted, set_verified};
    use sui::tx_context::TxContext;

    #[test]
    public fun test_voter_flow(ctx: &mut TxContext) {
        // Create a new voter with a dummy DID
        let did = utf8(b"did:example:1234");
        let mut voter = create_voter(did, ctx);

        // Initial state
        assert!(!is_verified(&voter), 100); // Should be false
        assert!(!has_voted(&voter), 101);   // Should be false

        // Set voter as verified
        set_verified(&mut voter, true);
        assert!(is_verified(&voter), 102); // Should be true

        // Mark as voted
        mark_as_voted(&mut voter);
        assert!(has_voted(&voter), 103);   // Should be true
    }
}

