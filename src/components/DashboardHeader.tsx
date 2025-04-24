import { BiCopy } from "react-icons/bi";

const DashboardHeader = ({
  copyAddress,
  truncateWalletAddress,
  address
}: {
  copyAddress: () => void;
  truncateWalletAddress: (value: string) => string;
  address: string;
}) => {
  return (
    <div className=" w-full shadow-sm p-4 flex flex-col justify-center items-center gap-3">
      <p className='font-extrabold text-lg'>Wallet</p>
      <div className='text-center font-light text-gray-500 flex gap-4'><p className="my-auto">{truncateWalletAddress(address)}</p> <button onClick={copyAddress} className='my-auto cursor-pointer p-1'><BiCopy /></button></div>
    </div>
  )
}
export default DashboardHeader