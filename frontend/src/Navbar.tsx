import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="flex items-center justify-between flex-wrap bg-purple-500 p-6">
      <div className="flex items-center flex-shrink-0 text-white mr-6">
        <span className="font-semibold text-xl tracking-tight">
          Event Driven Observability
        </span>
      </div>
      <div className="block lg:hidden">
        <button className="flex items-center px-3 py-2 border rounded text-purple-200 border-purple-400 hover:text-white hover:border-white">
          <svg
            className="fill-current h-3 w-3"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
          </svg>
        </button>
      </div>
      <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
        <div className="text-sm lg:flex-grow">
          <Link to="/" className="block mt-4 lg:inline-block lg:mt-0 text-purple-200 hover:text-white mr-4">Real-time</Link>
          <Link to="/history" className="block mt-4 lg:inline-block lg:mt-0 text-purple-200 hover:text-white mr-4">Job History</Link>
        </div>
        <div>
          {/* <a
            href="#"
            className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-purple-500 hover:bg-white mt-4 lg:mt-0"
          >
            Code
          </a> */}
        </div>
      </div>
    </nav>
  );
};
