import { Address } from "../scaffold-eth";
import { ETHToPrice } from "./EthToPrice";
import humanizeDuration from "humanize-duration";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  useAccountBalance,
  useDeployedContractInfo,
  useScaffoldContractRead,
  useScaffoldContractWrite,
} from "~~/hooks/scaffold-eth";
import { getTargetNetwork } from "~~/utils/scaffold-eth";
import { useState } from "react";

export const StakeContractInteraction = ({ address }: { address?: string }) => {
  const { address: connectedAddress } = useAccount();
  const { data: StakerContract } = useDeployedContractInfo("Staker");
  const { data: ExampleExternalContact } = useDeployedContractInfo("ExampleExternalContract");
  const { balance: stakerContractBalance } = useAccountBalance(StakerContract?.address);
  const { balance: exampleExternalContractBalance } = useAccountBalance(ExampleExternalContact?.address);

  const [customEthValue, setcustomEthValue] = useState<string>('');

  const configuredNetwork = getTargetNetwork();

  // Contract Read Actions
  const { data: threshold } = useScaffoldContractRead({
    contractName: "Staker",
    functionName: "threshold",
    watch: true,
  });
  // const { data: timeLeft } = useScaffoldContractRead({
  //   contractName: "Staker",
  //   functionName: "timeLeft",
  //   watch: true,
  // });
  const { data: myStake } = useScaffoldContractRead({
    contractName: "Staker",
    functionName: "balances",
    args: [connectedAddress],
    watch: true,
  });
  const { data: isStakingCompleted } = useScaffoldContractRead({
    contractName: "ExampleExternalContract",
    functionName: "completed",
    watch: true,
  });
  const { data: rewardRatePerSecond } = useScaffoldContractRead({
    contractName: "Staker",
    functionName: "rewardRatePerSecond",
    watch: true,
  });
  const { data: claimPeriodLeft } = useScaffoldContractRead({
    contractName: "Staker",
    functionName: "claimPeriodLeft",
    watch: true,
  });
  const { data: withdrawalTimeLeft } = useScaffoldContractRead({
    contractName: "Staker",
    functionName: "withdrawalTimeLeft",
    watch: true,
  });

  // Contract Write Actions
  const { writeAsync: stakeETH } = useScaffoldContractWrite({
    contractName: "Staker",
    functionName: "stake",
    //   value: "0.5",
    value: customEthValue,
  });
  const { writeAsync: execute } = useScaffoldContractWrite({
    contractName: "Staker",
    functionName: "execute",
  });
  const { writeAsync: withdrawETH } = useScaffoldContractWrite({
    contractName: "Staker",
    functionName: "withdraw",
  });

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent the default behavior of the button
    stakeETH(customEthValue);
  };

  return (
    <div className="flex items-center flex-col flex-grow w-full px-4 gap-12">
      {isStakingCompleted && (
        <div className="flex flex-col items-center gap-2 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-12 w-full max-w-lg">
          <p className="block m-0 font-semibold">
            {" "}
            🎉 &nbsp; Staking App triggered `ExampleExternalContract` &nbsp; 🎉{" "}
          </p>
          <div className="flex items-center">
            <ETHToPrice
              value={exampleExternalContractBalance != null ? exampleExternalContractBalance.toString() : undefined}
              className="text-[1rem]"
            />
            <p className="block m-0 text-lg -ml-1">staked !!</p>
          </div>
        </div>
      )}
      <div
        className={`flex flex-col items-center space-y-8 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 w-full max-w-lg ${!isStakingCompleted ? "mt-24" : ""
          }`}
      >
        <div className="flex flex-col w-full items-center">
          <p className="block text-2xl mt-0 mb-2 font-semibold">Staker Contract</p>
          <Address address={address} size="xl" />
        </div>
        <div className="flex items-start justify-around w-full">
          <div className="flex flex-col items-center justify-center w-1/2">
            <p className="block text-xl mt-0 mb-1 font-semibold">Claim Period Left</p>
            <p className="m-0 p-0">{claimPeriodLeft ? `${humanizeDuration(Number(claimPeriodLeft) * 1000)}` : 0}</p>
          </div>
          <div className="flex flex-col items-center w-1/2">
            <p className="block text-xl mt-0 mb-1 font-semibold">You Staked</p>
            <span>
              {myStake ? formatEther(myStake) : 0} {configuredNetwork.nativeCurrency.symbol}
            </span>
          </div>
        </div>
        <div className="flex items-start justify-around w-full">
          <div className="flex flex-col items-center justify-center w-1/2">
            <p className="block text-xl mt-0 mb-1 font-semibold">Withdrawal Period Left</p>
            <p className="m-0 p-0">{withdrawalTimeLeft ? `${humanizeDuration(Number(withdrawalTimeLeft) * 1000)}` : 0}</p>
          </div>
          <div className="flex flex-col items-center justify-center w-1/2">
            <p className="block text-xl mt-0 mb-1 font-semibold">Reward Rate</p>
            <p className="m-0 p-0">{Number(rewardRatePerSecond) / 1E18} ETH / second</p>
          </div>
        </div>
        <div className="flex flex-col items-center shrink-0 w-full">
          <p className="block text-xl mt-0 mb-1 font-semibold">Total Balance in Contract</p>
          <div className="flex space-x-2">
            {<ETHToPrice value={stakerContractBalance != null ? stakerContractBalance.toString() : undefined} />}
            {/* <span>/</span>
            {<ETHToPrice value={threshold ? formatEther(threshold) : undefined} />} */}
          </div>
        </div>
        <div className="flex flex-col space-y-5">
          <div className="flex space-x-7">
            <button className="btn btn-primary" onClick={() => execute()}>
              Execute!
            </button>
            <button className="btn btn-primary" onClick={() => withdrawETH()}>
              Withdraw
            </button>
          </div>
          {/* <button className="btn btn-primary" onClick={() => stakeETH()}>
            🥩 Stake 0.5 ether!
          </button> */}
          <input
            type="text"
            placeholder="Enter amount of ETH"
            className="input input-ghost focus:text-secondary-content h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-secondary-content"
            value={customEthValue}
            onChange={(e) => setcustomEthValue(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleButtonClick}>Stake ETH</button>
        </div>
      </div>
    </div>
  );
};
