const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const abi = ['function propertyCount() view returns (uint256)'];
  const contract = new ethers.Contract(
    '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    abi,
    provider
  );
  const count = await contract.propertyCount();
  console.log('Property count:', count.toString());
}

main().catch(console.error);