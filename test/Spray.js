const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const MAX_ACCOUNTS=100;

function accounts(n) {
  if (n > MAX_ACCOUNTS) {
    throw Error("too much accounts")
  }
  const res = [];
  for (let i = 0; i < n; i++) {
    res.push(ethers.utils.keccak256(i).substring(0, 42))
  }
  return res;
}

function accountsAccessList(n) {
  return accounts(n).map((a) => [a, []])
}

async function gasLinearRegressionForN(txFun, n1, n2) {
  const gas = async (n) => {
    const rec = await (await txFun(n)).wait()
    return rec.gasUsed
  }


  const forN1 = await gas(n1)
  const forN2 = await gas(n2)

  const increase = (forN2.sub(forN1)).div(n2 - n1)
  const constant = forN1.mul(n2).sub(forN2.mul(n1)).div(n2 - n1)
  return { increase, constant, forN2}
}

function reportGas(name, increase, constant, n, forN) {
  console.log(`${name}: constant-gas=${constant} delta-per-addr=${increase} total-gas(n=${n})=${forN}`)
}


describe("Spray", function () {
  async function fundAccounts() {
    const [signer] = await ethers.getSigners()
    await Promise.all(accounts(MAX_ACCOUNTS).map((account) => signer.sendTransaction({value: 1, to: account})));
  }

  async function deploySpraySolFixture() {
    const Spray = await ethers.getContractFactory("SpraySol");
    const spray = await Spray.deploy();
    await fundAccounts()
    return { spray };
  }

  async function deploySprayEVASMFixture() {
    const SpraySol = await ethers.getContractFactory("SpraySol");
    // code: https://github.com/dvush/cl-evasm/blob/main/src/examples/spray.lisp
    const Spray = new ethers.ContractFactory(SpraySol.interface,
        "0x61002e600c60003961003a5660243560005b80821461002c57806020026044013560006000600060006001856000f15050600101610005565b505b602e6000f3",
        SpraySol.signer
    )

    const spray = await Spray.deploy();
    await fundAccounts()
    return { spray };
  }

  describe("SpraySol", function () {
    it("SpraySolTest", async function () {
      const {spray} = await loadFixture(deploySpraySolFixture);

      await expect(await spray.Spray(accounts(10), {value: 10})).to.changeEtherBalances(
          accounts(),
          Array(10).fill(1)
      );
    })

    it("SpraySolGas", async function () {
      const {spray} = await loadFixture(deploySpraySolFixture);

      const {increase, constant, forN2} = await gasLinearRegressionForN(
          //(n) => spray.Spray(accounts(n), {value: n, accessList: accountsAccessList(n)}),
          (n) => spray.Spray(accounts(n), {value: n, accessList: accountsAccessList(n)}),
          20, 50);

      reportGas("SpraySol(access-list)", increase, constant, 50, forN2)
    })

    it("SpraySolGas", async function () {
      const {spray} = await loadFixture(deploySpraySolFixture);

      const {increase, constant, forN2} = await gasLinearRegressionForN(
          //(n) => spray.Spray(accounts(n), {value: n, accessList: accountsAccessList(n)}),
          (n) => spray.Spray(accounts(n), {value: n}),
          20, 50);

      reportGas("SpraySol(no access-list)", increase, constant, 50, forN2)
    })
  })


  describe("SprayClEvasm", function () {
    it("SprayClEvasmTest", async function () {
      const {spray} = await loadFixture(deploySprayEVASMFixture);

      await expect(await spray.Spray(accounts(10), {value: 10})).to.changeEtherBalances(
          accounts(),
          Array(10).fill(1)
      );
    })

    it("SprayClEvasmGas", async function () {
      const {spray} = await loadFixture(deploySprayEVASMFixture);

      const {increase, constant, forN2 } = await gasLinearRegressionForN(
          (n) => spray.Spray(accounts(n), {value: n}),
          20, 50);

      reportGas("SprayClEvasm(no access-list)", increase, constant, 50, forN2)
    })

    it("SprayClEvasmGasAccessList", async function () {
      const {spray} = await loadFixture(deploySprayEVASMFixture);

      const {increase, constant, forN2 } = await gasLinearRegressionForN(
          (n) => spray.Spray(accounts(n), {value: n, accessList: accountsAccessList(n)}),
          20, 50);

      reportGas("SprayClEvasm(access-list)", increase, constant, 50, forN2)
    })
  })
});
