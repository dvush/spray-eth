# Intro

The goal is to send 1 wei from contract to set of addresses as cheaply as possible.

2 implementations are compared here
1. Written in asm from scratch [spray.lisp](https://github.com/dvush/cl-evasm/blob/main/src/examples/spray.lisp)
2. Naive solidity [Spray.sol](./contracts/Spray.sol)

Both implement interface:
```solidity
interface ISpray {
    function Spray(address[] calldata targets) payable external;
}
```

Since compliance providers use the number of hops to sanctioned address (e.g. Tornado Cash) this can be used
by a malicious actor to touch as many accounts as possible doing one hop from Tornado at a cost of ~10k gas per address.
I don't recommend it, and it will probably force compliance providers to implement a value threshold if they don't already do it.

# Costs

Comparison of two contracts with and without access list containing all targets:

```
SpraySol(no access-list):     constant-gas=21638 delta-per-addr=9823 total-gas(n=50)=512818
SprayClEvasm(no access-list): constant-gas=21363 delta-per-addr=9752 total-gas(n=50)=508993

SpraySol(access-list):        constant-gas=21638 delta-per-addr=9723 total-gas(n=50)=507818
SprayClEvasm(access-list):    constant-gas=21363 delta-per-addr=9652 total-gas(n=50)=503993
```

The cheapest way is to use cl-evasm implementation with access list but it is only ~1% cheaper than the simple solidity version.
Bytecode of sol version is 6 times bigger.

# How to use

See `test/Spray.js` for instructions or deploy this code (send tx to null address with the given data).
```
0x61002e600c60003961003a5660243560005b80821461002c57806020026044013560006000600060006001856000f15050600101610005565b505b602e6000f3
```

Encode tx with ABI above, and use the access list that contains all target addresses.
