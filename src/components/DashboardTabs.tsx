import { useEffect, useState } from "react"

export interface Token {
  name: string;
  icon: string;
  value: string;
}

const DashboardTabs = ({ uccBalance }:{ uccBalance: string }) => {
  const [tab, setTab] = useState<'token' | 'activity'>('token');
  const [content, setContent] = useState<Token[] | any[]>([]);
  
  const tokens: Token[] = [
    {
      name: "ucc",
      icon: "/logo.png",
      value: uccBalance
    }
  ];

  const activities: any[] = []

  useEffect(() => {
    if (tab === "token"){
      setContent(tokens);
    }
    if (tab === "activity") {
      setContent(activities);
    }
  }, [tab]);
  
  return (
    <div>
      <div className="flex w-full justify-between h-fit">
        <button
          className={`text-center w-full text-lg font-semibold cursor-pointer ${tab === "token" ? "text-slate-800" : "text-gray-500"}`}
          onClick={() => setTab("token")}
        >
          Tokens
          <div className={`w-full h-[2px] rounded-full mt-3 ${tab === "token" ? "bg-slate-800" : "bg-gray-500"}`}></div>
        </button>
        <div className="h-full w-1 bg-slate-700"></div>
        <button
          className={`text-center w-full text-lg font-semibold cursor-pointer ${tab === "activity" ? "text-slate-800" : "text-gray-500"}`}
          onClick={() => setTab("activity")}
        >
          Activity
          <div className={`w-full h-[2px] rounded-full mt-3 ${tab === "activity" ? "bg-slate-800" : "bg-gray-500"}`}></div>
        </button>
      </div>
      <div className="w-full">
        {content.length !== 0 ? (
          <div className="flex flex-coll gap-2 mt-5">
            {tokens.map((item, i) => (
              <div
                className="flex justify-between gap-5 p-4 rounded-md hover:bg-white ease-linear duration-200 w-full"
                key={i}
              >
                <div className="flex gap-5 my-auto">
                  <div className="rounded-full border border-slate-800 overflow-hidden my-auto h-10 w-10">
                    <img src={item.icon} className="w-full h-full object-cover" />
                  </div>
                  <p className="my-auto text-lg font-semibold text-slate-800 uppercase">{item.name}</p>
                </div>
                <p className="my-auto text-sm font-bold text-gray-400">{item.value}{item.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full text-center py-10 text-gray-400">No activities</div>
        )}
        {/* {content === activities && (
          <div className="w-full text-center py-10 text-gray-400">No activities</div>
        )} */}
      </div>
    </div>
  )
}
export default DashboardTabs