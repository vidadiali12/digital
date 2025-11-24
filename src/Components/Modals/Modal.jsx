import './Modal.css'

const Modal = ({ modalValues, setModalValues }) => {

    const accept = () => {
        setModalValues(prev=>({
            ...prev,
            message: null,
            answer: true,
            showModal: null,
            isQuestion: null,
        }))
    }
    const reject = () => {
        setModalValues({
            message: null,
            answer: null,
            showModal: null,
            isQuestion: null,
            type: null
        })
    }


    return (
        <div className='modal-back'>
            <div className='modal'>
                <p>
                    {
                        modalValues?.message
                    }
                </p>
                <div>
                    <button onClick={reject} style={modalValues?.isQuestion ? { backgroundColor: 'red' } : { backgroundColor: 'gray' }}>
                        {
                            !modalValues?.isQuestion ? 'Bağla' : 'Xeyr'
                        }
                    </button>
                    <button onClick={accept} style={modalValues?.isQuestion ? { display: 'inline-block' } : { display: 'none' }}>
                        Bəli
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Modal