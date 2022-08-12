// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;


interface ISpray {
    function Spray(address[] calldata targets) payable external;
}

contract SpraySol {
    function Spray(address payable[] calldata targets) payable external {
        uint n = targets.length;
        for (uint i = 0; i < n;) {
            targets[i].call{value: 1, gas: 0}("");
            unchecked {
                ++i;
            }
        }
    }
}
