import { Chessboard } from "react-chessboard"
import { useState, useEffect } from "react"
import {Chess} from "chess.js"
import RandomVariant from "../component/RandomVariant"
import '../App.css'
import { Outlet, useNavigate } from "react-router-dom"
import {fetchWithAuth} from "../service/fetchWithAuth";


const defaultVariants = [];
const defaultBg = 'bg-base-100';

export default function Root(){

    const navigate = useNavigate();

    const [showChessboardButtons, setShowChessboardButtons] = useState(false);
    const [repositoryId, setRepositoryId] = useState<number|null>(null);

    const token = localStorage.getItem('jwt');

    const [game, setGame] = useState<Chess>(new Chess());
    const [moves, setMoves] = useState([]);
    const [appToken, setToken] = useState<null|string>(token);
    const [counter, setCounter] = useState(0);
    const [opponentCounter, setOpponentCounter] = useState(1);
    const [randomVariant, setRandomVariant] = useState<null|object>(null);
    const [isRandom, setRandom] = useState(false);
    const [variants, setVariants] = useState(defaultVariants);
    const [showVariantInput, setShowVariantInput] = useState(false);
    const [variantLabel, setVariantLabel] = useState('Variant');
    const [chessboardBg, setChessboardBg] = useState(defaultBg);
    const [boardOrientation, setBoardOrientation] = useState('white');
    const [moveCounter, setMoveCounter] = useState(0);

    useEffect(() => {
        if(isRandom){
            setGame(new Chess());
            pickRandomVariant();
        }else{
            setRandomVariant(null);
            setGame(new Chess);
        }

        setMoves([]);
        setMoveCounter(0);

    }, [isRandom]);

    useEffect(() => {
        if(chessboardBg !== defaultBg){
            setTimeout(() => {
                setChessboardBg(defaultBg);
            }, 1000);
        }
    }, [chessboardBg]);

    useEffect(() => {
        const handleKeydown = (event) => {
            if(isRandom){
                return;
            }

            if(moves.length === 0){
                return;
            }

            let fen = null;

            if (event.key === 'ArrowLeft') {

                const returnMove = moves[moveCounter - 1];
                if(!returnMove){
                    return;
                }
                fen = returnMove.before;

                setMoveCounter(moveCounter - 1);
            } else if (event.key === 'ArrowRight') {
                const returnMove = moves[moveCounter];
                if(!returnMove){
                    return;
                }
                fen = returnMove.after;
                setMoveCounter(moveCounter + 1);
            }else{
                return;
            }

            if(!fen){
                return;
            }

            const newGame = new Chess(fen);
            setGame(newGame);
        };

        window.addEventListener('keydown', handleKeydown);

        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    }, [moveCounter]);

    function makeAMove(move) {
        const gameCopy = getGameCopy();
        const result = gameCopy.move(move);
        if (result) {
            let newMoves = [...moves];

            if(moves.length > 1){
                const lastMove = moves[moves.length - 1];

                if(result.color === lastMove.color){
                    newMoves.pop();
                }
            }

            if(isRandom){
                playMode(gameCopy, result);
            }else{
                setGame(gameCopy);
                setMoveCounter(moveCounter + 1);
            }

            setMoves([...newMoves, {
                from: result.from,
                to: result.to,
                san: result.san,
                before: result.before,
                after: result.after,
                color: result.color,
            }]);
        }
        return result;
    }

    function getGameCopy(){
        return new Chess(game.fen());
    }

    function nextMoveByOpponent(gameCopy) {
        const nextMove = randomVariant.moves[opponentCounter];

        if(nextMove){
            const newGame = new Chess(gameCopy.fen());
            const result = newGame.move({
                from: nextMove.from,
                to: nextMove.to,
                promotion:'q',
            });
            if (result) {
                setGame(newGame);
                setOpponentCounter(opponentCounter + 2);
            }

            if(opponentCounter + 1 >= randomVariant.moves.length){
                setVariantEndTimeout();
            }
        }else{
            setGame(gameCopy);
            setVariantEndTimeout();
        }
    }

    function setVariantEndTimeout() {
        setTimeout(() => {
            pickRandomVariant();
        }, 1000);
    }

    function checkCorrectMove(move) {
        const currentMove = randomVariant.moves[counter];
        return move.san === currentMove.san;
    }

    function playMode(game, move) {
        if(checkCorrectMove(move)){
            setChessboardBg('bg-success/70');
            setCounter(counter + 2);
            nextMoveByOpponent(game);
        }else{
            setChessboardBg('bg-error/70');
            console.log('wrong move');
        }
    }

    function onDrop(sourceSquare, targetSquare) {
        const move = makeAMove({
            from: sourceSquare,
            to: targetSquare,
            promotion:'q',
        });
        return true;
    }

    function resetBoard() {
        const newGame = new Chess();
        setGame(newGame);
        setOpponentCounter(1);
        setCounter(0);
        setMoves([]);
    }

    function getRandomVariantIndex(){
        if(variants.length > 1){
            if(!randomVariant){
                return Math.floor(Math.random() * variants.length);
            }else{
                let newRandomVariantIndex;
                let newRandomVariant;
                do {
                    newRandomVariantIndex = Math.floor(Math.random() * variants.length);
                    newRandomVariant = variants[newRandomVariantIndex];
                }while (newRandomVariant.id  === randomVariant.id);
                return newRandomVariantIndex;
            }
        }else{
            return 0;
        }
    }

    function pickRandomVariant() {
        const randomIndex = getRandomVariantIndex();
        const newRandomVariant = variants[randomIndex];

        if(newRandomVariant.orientation === 'white'){
            setGame(new Chess());
            setCounter(0);
            setOpponentCounter(1);
            setMoves([]);
        }else{
            const firstMove = newRandomVariant.moves[0];
            setGame(new Chess(firstMove.after));
            setCounter(1);
            setMoves([firstMove]);
            setOpponentCounter(2);
        }

        setRandomVariant(variants[randomIndex]);
        setBoardOrientation(variants[randomIndex].orientation);
    }

    function switchRandom() {
        if(variants.length > 0){
            setRandom(!isRandom);
        }
    }

    function displayAddVariant() {
        if(moves.length < 5){
            return;
        }

        if(isRandom){
            return;
        }

        setShowVariantInput(true);
    }

    async function addVariant() {
        const newVariant = {
            name: variantLabel,
            moves: moves,
            orientation: boardOrientation,
            book_id: repositoryId,
        };

        const response = await fetchWithAuth('api/variant', {
            method: "POST",
            body: newVariant,
        })

        if(response.ok){

            const result = await response.json();

            setVariants([...variants, result]);
            setMoves([]);
            setGame(new Chess());
            setShowVariantInput(false);
        }
    }

    const changeVariantLabel = (item) => {
        setVariantLabel(item.target.value);
    }

    const changeBoardOrientation = () => {
        setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
    }

    const logout = () => {
        setToken(null);
        localStorage.removeItem('jwt');
        navigate('/login');
    }


    return (
        <>
            <button className={`btn btn-error absolute right-5 top-5 shadow-xl ` + (appToken ? '' : 'hidden')} onClick={logout}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 576 512"><path d="M320 32c0-9.9-4.5-19.2-12.3-25.2S289.8-1.4 280.2 1l-179.9 45C79 51.3 64 70.5 64 92.5L64 448l-32 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 192 0 32 0 0-32 0-448zM256 256c0 17.7-10.7 32-24 32s-24-14.3-24-32s10.7-32 24-32s24 14.3 24 32zm96-128l96 0 0 352c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-32 0 0-320c0-35.3-28.7-64-64-64l-96 0 0 64z"/></svg>
                {/*<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 512 512"><path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"/></svg>*/}
            </button>
            <div className="min-h-lvh bg-base-300">
                {randomVariant ? <RandomVariant variant={randomVariant} /> : ''}
                <div className="flex justify-center pt-28 gap-5 items-start">
                    <div className="p-5 shadow-2xl bg-base-100 rounded-lg w-80">

                            <Outlet context={{setShowChessboardButtons, setVariants, variants, setRepositoryId, setToken, setRandom}}/>
                        {/*<h3 className="text-xl font-bold mb-5">Variations</h3>*/}

                        {/*<div className="flex gap-2 flex-col">*/}
                        {/*    {variants.map((variant, index) => {*/}
                        {/*        return <div className="collapse bg-base-200 max-w-80 w-80" key={index}>*/}
                        {/*            <input type="checkbox" />*/}
                        {/*            <div className="collapse-title text-lg font-medium">{variant.name}</div>*/}
                        {/*            <div className="collapse-content">*/}
                        {/*                {variant.moves.map(move => move.san).join(', ')}*/}
                        {/*            </div>*/}
                        {/*        </div>*/}
                        {/*    })}*/}
                        {/*</div>*/}
                    </div>
                    <div id="chess_board" className={`p-5 shadow-2xl bg-base-100 rounded-lg ${chessboardBg}`}>
                        <Chessboard
                            position={game.fen()}
                            onPieceDrop={onDrop}
                            boardOrientation={boardOrientation}
                            //boardOrientation={"black"}
                        />
                    </div>
                    <div className="p-5 shadow-2xl bg-base-100 rounded-lg w-80">

                        {showChessboardButtons ? <>
                        <div className="flex gap-2">
                            <button className="btn btn-error" onClick={resetBoard}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 576 512"><path d="M566.6 54.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192-34.7-34.7c-4.2-4.2-10-6.6-16-6.6c-12.5 0-22.6 10.1-22.6 22.6l0 29.1L364.3 320l29.1 0c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16l-34.7-34.7 192-192zM341.1 353.4L222.6 234.9c-42.7-3.7-85.2 11.7-115.8 42.3l-8 8C76.5 307.5 64 337.7 64 369.2c0 6.8 7.1 11.2 13.2 8.2l51.1-25.5c5-2.5 9.5 4.1 5.4 7.9L7.3 473.4C2.7 477.6 0 483.6 0 489.9C0 502.1 9.9 512 22.1 512l173.3 0c38.8 0 75.9-15.4 103.4-42.8c30.6-30.6 45.9-73.1 42.3-115.8z"/></svg>
                            </button>
                            <button className="btn btn-primary" onClick={displayAddVariant}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>
                            </button>
                            <button className="btn btn-primary" onClick={changeBoardOrientation}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 512 512"><path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z"/></svg>
                            </button>
                            <button className={isRandom ? 'btn btn-success' : 'btn btn-active'} onClick={switchRandom}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 448 512"><path d="M96 48L82.7 61.3C70.7 73.3 64 89.5 64 106.5l0 132.4c0 10.7 5.3 20.7 14.2 26.6l10.6 7c14.3 9.6 32.7 10.7 48.1 3l3.2-1.6c2.6-1.3 5-2.8 7.3-4.5l49.4-37c6.6-5 15.7-5 22.3 0c10.2 7.7 9.9 23.1-.7 30.3L90.4 350C73.9 361.3 64 380 64 400l320 0 28.9-159c2.1-11.3 3.1-22.8 3.1-34.3l0-14.7C416 86 330 0 224 0L83.8 0C72.9 0 64 8.9 64 19.8c0 7.5 4.2 14.3 10.9 17.7L96 48zm24 68a20 20 0 1 1 40 0 20 20 0 1 1 -40 0zM22.6 473.4c-4.2 4.2-6.6 10-6.6 16C16 501.9 26.1 512 38.6 512l370.7 0c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16L384 432 64 432 22.6 473.4z"/></svg>
                            </button>
                        </div>

                            {showVariantInput ? <div className="flex gap-2 mt-3">
                                <input type="text" placeholder="Type here" value={variantLabel} className="input input-bordered w-full max-w-xs" onChange={changeVariantLabel} />
                                <button className="btn btn-success" onClick={addVariant}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
                                </button>
                            </div> : ''}

                            <details className="collapse collapse-arrow border-base-300 bg-base-200 border mt-5">
                                <summary className="collapse-title text-xl font-medium">How it works ?</summary>
                                <div className="collapse-content">

                                    <p>To add a variation, simply play to the desired position and click +. There is no limit on the number of moves.</p>

                                    <div className="flex justify-start items-center gap-2 mt-3">
                                        <button className="btn btn-error">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 576 512"><path d="M566.6 54.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192-34.7-34.7c-4.2-4.2-10-6.6-16-6.6c-12.5 0-22.6 10.1-22.6 22.6l0 29.1L364.3 320l29.1 0c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16l-34.7-34.7 192-192zM341.1 353.4L222.6 234.9c-42.7-3.7-85.2 11.7-115.8 42.3l-8 8C76.5 307.5 64 337.7 64 369.2c0 6.8 7.1 11.2 13.2 8.2l51.1-25.5c5-2.5 9.5 4.1 5.4 7.9L7.3 473.4C2.7 477.6 0 483.6 0 489.9C0 502.1 9.9 512 22.1 512l173.3 0c38.8 0 75.9-15.4 103.4-42.8c30.6-30.6 45.9-73.1 42.3-115.8z"/></svg>
                                        </button>

                                        <p>Clean the chessboard</p>
                                    </div>

                                    <div className="flex justify-start items-center gap-2 mt-3">
                                        <button className="btn btn-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>
                                        </button>

                                        <p>Add variant (min. 5 moves)</p>
                                    </div>

                                    <div className="flex justify-start items-center gap-2 mt-3">
                                        <button className="btn btn-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 512 512"><path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z"/></svg>
                                        </button>

                                        <p>Change chessboard orientation</p>
                                    </div>

                                    <div className="flex justify-start items-center gap-2 mt-3">
                                        <button className="btn btn-success">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-base-100" viewBox="0 0 448 512"><path d="M96 48L82.7 61.3C70.7 73.3 64 89.5 64 106.5l0 132.4c0 10.7 5.3 20.7 14.2 26.6l10.6 7c14.3 9.6 32.7 10.7 48.1 3l3.2-1.6c2.6-1.3 5-2.8 7.3-4.5l49.4-37c6.6-5 15.7-5 22.3 0c10.2 7.7 9.9 23.1-.7 30.3L90.4 350C73.9 361.3 64 380 64 400l320 0 28.9-159c2.1-11.3 3.1-22.8 3.1-34.3l0-14.7C416 86 330 0 224 0L83.8 0C72.9 0 64 8.9 64 19.8c0 7.5 4.2 14.3 10.9 17.7L96 48zm24 68a20 20 0 1 1 40 0 20 20 0 1 1 -40 0zM22.6 473.4c-4.2 4.2-6.6 10-6.6 16C16 501.9 26.1 512 38.6 512l370.7 0c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16L384 432 64 432 22.6 473.4z"/></svg>
                                        </button>

                                        <p>Game mode</p>
                                    </div>
                                </div>
                            </details>
                        </> :
                            <>
                                <h3 className="text-xl font-bold mb-3">About project</h3>

                                <p>
                                    Enhance your chess skills by mastering openings with our interactive tool.
                                    Create a repertoire, like the Italian Game, adding moves and variations you want to learn.
                                    In <b>Game Mode</b>, the system randomly selects one of your variations, guiding you through each move as you play against a simulated opponent.
                                    This approach helps you not only memorize but also deeply understand different openings, boosting your confidence and skills.
                                </p>
                        </>
                        }

                    </div>
                </div>
            </div>
        </>
    );
}