import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {useEffect, useState} from "react";
import {fetchWithAuth} from "../service/fetchWithAuth";
import { useOutletContext } from 'react-router-dom';

export default function Repository(){

    const {repository_id} = useParams();
    const navigate = useNavigate();

    const { setShowChessboardButtons, setVariants, variants, setRepositoryId, setRandom } = useOutletContext();

    setRepositoryId(repository_id);
    setShowChessboardButtons(true);

    const [repositoryData, setRepositoryData] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchWithAuth('api/book/' + repository_id);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const result = await response.json();
                setRepositoryData(result);
                setVariants(result.variants);
            } catch (error) {
                navigate('/login');
            }
        };

        fetchData();

        return () => {
            setRandom(false);
        }
    }, []);

    const removeVariant = async (id) => {

        const result = await fetchWithAuth('api/variant/'+id, {
            method: "DELETE"
        });

        if(result.ok){
            const newVariants = variants.filter(variant => variant.id !== id);
            setVariants(newVariants);
        }
    }

    return (
        <>
            <div className="flex mb-5 justify-between items-center">
                <h3 className="text-xl font-bold">{repositoryData.name}</h3>
                <NavLink to="/" className="btn btn btn-primary shadow-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 512 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 288 480 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-370.7 0 73.4-73.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-128 128z"/></svg>
                </NavLink>
            </div>

            {variants.length > 0 ? <div className="flex gap-2 flex-col">
                {variants.map((variant, index) => {

                    return <details className="collapse border-base-300 bg-base-200 border mt-3" key={index}>
                        <summary className="collapse-title text-xl font-medium pr-5">
                            <div className="flex justify-between items-center">
                                {variant.name}

                                <div onClick={(e) => {
                                    removeVariant(variant.id);
                                    e.preventDefault();
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-error"viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                                </div>
                            </div>
                        </summary>
                        <div className="collapse-content">
                            <div className="italic">
                                {variant.moves.map(move => move.san).join(', ')}
                            </div>
                        </div>
                    </details>;
                })}
            </div>: <p className="italic">To add a variation, simply play to the desired position and click +. There is no limit on the number of moves.</p>}
        </>
    );
}