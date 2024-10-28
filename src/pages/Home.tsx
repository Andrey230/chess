import { useState, useEffect } from "react"
import {fetchWithAuth} from "../service/fetchWithAuth";
import { NavLink, useNavigate, useOutletContext } from "react-router-dom";

export default function Home(){

    const navigate = useNavigate();

    const [repositories, setRepositories] = useState([]);
    const { setShowChessboardButtons } = useOutletContext();
    setShowChessboardButtons(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchWithAuth('api/user'); // Укажите нужный endpoint
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const result = await response.json();
                setRepositories(result.books);
            } catch (error) {
                navigate('/login');
            }
        };

        fetchData();
    }, []);

    return (
        <>
            <div className="flex mb-5 justify-between items-center">
                <h3 className="text-xl font-bold">Your repositories</h3>
                <NavLink to="/add-repository" className="btn btn btn-success">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>
                </NavLink>
            </div>

            <div className="flex gap-2 flex-col">
                {repositories.length > 0 ? repositories.map((repository, index) => {
                        return <NavLink to={`/repository/${repository.id}`} key={index}>
                            <div className="collapse bg-base-200">
                                <div className="collapse-title text-lg font-medium">
                                    {repository.name}
                                </div>
                            </div>
                        </NavLink>
                    }) : <p className="italic font-medium">You don't have any repositories yet. Click + to add</p>}

            </div>
        </>
    );
}