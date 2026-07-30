import React from 'react'
import { useState } from 'react'
import toast from 'react-hot-toast';
import { createRoomApi }from '../Service/RoomService';
import useChatContext from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { joinChatApi } from '../config/AxiosHelper';

const JoinCreateChat = () => {

    const[detail, setDetail] = useState({
        roomId: '',
        userName: '',
    });

    const navigate = useNavigate();

    const {roomId, userName, setRoomId, setCurrentUser, setConnected} = useChatContext();

    function handleFormInputChange(event){
        setDetail({
            ...detail,
            [event.target.name]: event.target.value,
        });
    }

    function validateForm(){
        if(detail.userName.trim() === '' || detail.roomId.trim() === ''){
            toast.error("Invalid input");
            return false;
    }
    return true;
}

    async function joinChat(){
        if(validateForm()){
            try {
            const room = await joinChatApi(detail.roomId);
            toast.success("Joined room successfully");
            setCurrentUser(detail.userName);
            setRoomId(room.roomId);
            setConnected(true);
            navigate('/chat');
            }
            catch(error){
                if(error.response && error.response.status === 400){
                    toast.error(error.response.data);
                }
                else {
                    toast.error("Error joining room");
                }
                console.log(error);
            }
        }
    }

    async function createRoom(){
        if(!validateForm()) return;
        console.log(detail);
        try{
            const response = await createRoomApi({roomId : detail.roomId});
            console.log(response);
            toast.success("Room created successfully");
            setCurrentUser(detail.userName);
            setRoomId(response.roomId);
            setConnected(true);
            navigate('/chat');

        }
        catch(error){
            console.log(error);
            if(error.response && error.response.status === 400){
                toast.error("Room already exists");
            }
            else {
                toast.error("Error creating room");
            }
        }
    }


  return (
    <div className='min-h-screen flex items-center justify-center'>
        <div className='p-10 dark:border-gray-700 border w-full max-w-md flex flex-col gap-5 rounded dark:bg-gray-900 shadow'>
            <h1 className='text-2xl font-semibold text-center'>Join Room / Create Room</h1>
            <div>
                <label htmlFor='name' className='block font-medium mb-2'>
                    Your Name
                </label>
                <input
                onChange={handleFormInputChange}
                 value={detail.userName}
                 placeholder='Enter the name'
                 name='userName'
                type='text' id='name' className='w-full dark:bg-gray-600 px-4 py-2 border dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'></input>
            </div>
            <div>
                <label htmlFor='name' className='block font-medium mb-2'>
                    Room ID / New Room ID
                </label>
                <input 
                onChange={handleFormInputChange}
                value={detail.roomId}
                placeholder='Enter the room id'
                name='roomId'
                 type='text' id='name' className='w-full dark:bg-gray-600 px-4 py-2 border dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'></input>
            </div>
            <div className='flex justify-center gap-2 mt-4'>
                <button 
                onClick={joinChat}
                className='px-3 py-2 dark:bg-blue-500 hover:dark:bg-blue-600 rounded-full cursor-pointer'>Join Room</button>
                <button
                onClick={createRoom}
                className='px-3 py-2 dark:bg-orange-500 hover:dark:bg-orange-600 rounded-full cursor-pointer'>Create Room</button>
            </div>
            
        </div>

    </div>
  )
}

export default JoinCreateChat