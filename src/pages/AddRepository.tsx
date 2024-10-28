import {useState} from "react";
import { useNavigate } from "react-router-dom";
import signup from "../service/signup";
import {fetchWithAuth} from "../service/fetchWithAuth";

export default function AddRepository(){

    const navigate = useNavigate();

    const [name, setName] = useState('');

    const repositoryForm = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const data = {
            name: formData.get('name'),
        };

        try {
            const response = await fetchWithAuth('api/book', {
                method: 'POST',
                body: data
            });

            if(response.ok){
                navigate('/');
            }
        }catch (e){
            console.log(e.message);
        }
    }


    return (
        <>
            <h3 className="text-xl font-bold mb-5">Create repository</h3>

            <form onSubmit={repositoryForm}>
                <label className="input input-bordered flex items-center gap-2 mb-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-4 w-4 opacity-70">
                        <path
                            d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                        <path
                            d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                    </svg>
                    <input type="text" className="grow" placeholder="Name" value={name} name="name" onChange={(e) => setName(e.target.value)} />
                </label>

                <button className="btn btn-primary">Add</button>
            </form>
        </>
    );
}