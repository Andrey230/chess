export default function RandomVariant({variant}){
    return (
        <>
            <div className="p-5 shadow-2xl bg-base-100 rounded-lg absolute top-5 left-1/2 -translate-x-1/2">
                <p className="font-bold">{variant.name}</p>
            </div>
        </>
    )
}