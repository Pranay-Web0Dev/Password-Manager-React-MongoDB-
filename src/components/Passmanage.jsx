import React from 'react'
import { useRef, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const Passmanage = () => {
  const ref = useRef()
  const passwordref = useRef()

  const [form, setform] = useState({ site: "", username: "", password: "" })

  const [passwordArray, setpasswordArray] = useState([])

  const getPassword = async () => {

    let req = await fetch("http://localhost:4000/")
    let passwords = await req.json();
    console.log(passwords)
    setpasswordArray(passwords);
  }


  useEffect(() => {
    //   console.log(form)
    getPassword()
  }, [])


  const showpassword = () => {

    // passwordref.current.type = "text"
    if (ref.current.src.includes("icons/view.png")) {
      ref.current.src = "icons/hide.png"
      passwordref.current.type = "text"
    }
    else {
      ref.current.src = "icons/view.png"
      passwordref.current.type = "password"
    }
  }

  const savepassword = async () => {
    if (form.site.length > 3 && form.username.length > 3 && form.password.length > 3) {

      // for deleting the existing password
      await fetch("http://localhost:5173/",{method:"DELETE", headers:{"content-type":"application/json"},
        body:JSON.stringify({id: form.id}) })

      setpasswordArray([...passwordArray, { ...form, id: uuidv4() }])
      // localStorage.setItem("passwords", JSON.stringify([...passwordArray, { ...form, id: uuidv4() }]))
      // console.log([...passwordArray, { ...form, id: uuidv4() }])
      let req = await fetch("http://localhost:5173/",{method:"POST", headers:{"content-type":"application/json"},
      body:JSON.stringify({...form, id:uuidv4() }) })
      setform({ site: "", username: "", password: "" })
      toast("password saved!!")
    }
    else {
      toast("error: passowrd not saved!!")
    }
  }

  const deletePassword = async(id) => {
    const c = confirm("do you want to delete this password")
    if (c) {
      setpasswordArray(passwordArray.filter(item => item.id !== id))
      // localStorage.setItem("passwords", JSON.stringify(passwordArray.filter(item => item.id !== id)))
       await fetch("http://localhost:5173/",{method:"DELETE", headers:{"content-type":"application/json"},
        body:JSON.stringify({ id}) })
      toast("Password deleted!");
    }

  }
  const editPassword = (id) => {
    setform({...passwordArray.filter(i => i.id === id)[0], id:id})
    setpasswordArray(passwordArray.filter(item => item.id !== id))
  }

  const handlechange = (e) => {
    setform({ ...form, [e.target.name]: e.target.value })
  }

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className='text-center mt-8'>
      <div className="head text-3xl font-bold">
        <span className='text-green-700'>&lt;</span>
        <span>Pass</span>
        <span className='text-green-700'>OP/&gt;</span>
      </div>
      <div className="discription text-lg font-semibold">your own password manager</div>
      <div className="urls">
        <input name='site' value={form.site} onChange={handlechange} className='my-6 w-2/5 rounded-full px-3 py-1 border border-black placeholder:text-black' type="text" placeholder='enter the URL' />
      </div>
      <div className="usernPass flex justify-between border-red-400 w-2/5 mx-auto ">
        <input value={form.username} onChange={handlechange} name='username' className='rounded-full px-3 py-1 border border-black placeholder:text-black w-2/5' type="text" placeholder='enter the Username' />
        <div className="password w-2/5 relative">

          <input ref={passwordref} value={form.password} onChange={handlechange} className='rounded-full px-3 py-1 border border-black placeholder:text-black  ' type="password" placeholder='enter the password ' name='password' />
          <div className="img absolute right-8 bottom-1 cursor-pointer" onClick={showpassword}>
            <img ref={ref} className='w-5 ' src="icons/view.png" alt="" />
          </div>

        </div>
      </div>
      <div className="save">
        <button onClick={savepassword} className='mt-6  bg-green-500 text-white font-semibold px-4 py-1 rounded-full hover:bg-green-700'>
          Add Password
        </button>
      </div>
      <div className="passwords w-2/5  mx-auto flex flex-col ">
        <h2 className='font-bold text-2xl py-4 left-0 place-self-start'>Your Passwords</h2>
        {passwordArray.length === 0 && <div> No passwords to show</div>}
        {passwordArray.length != 0 && <table className="table-auto rounded-md overflow-hidden mb-10 ">
          <thead className='bg-green-800 text-white max-w-full'>
            <tr>
              <th className='py-2'>Site</th>
              <th className='py-2'>Username</th>
              <th className='py-2'>Password</th>
              <th className='py-2'>Actions</th>
            </tr>
          </thead>
          <tbody className='bg-green-100'>
            {passwordArray.map((item, index) => {
              return <tr key={index}>
                <td className='py-2 border border-white text-center'>
                  <div className='flex items-center justify-center '>
                    <a href={item.site} target='_blank'>{item.site}</a>
                    <div className='lordiconcopy size-7 cursor-pointer' onClick={() => { copyText(item.site) }}>
                      <img className='w-3 mt-2 ml-2' src="./public/icons/copy.png" alt="" />
                    </div>
                  </div>
                </td>
                <td className='py-2 border border-white text-center'>
                  <div className='flex items-center justify-center '>
                    <span>{item.username}</span>
                    <div className='lordiconcopy size-7 cursor-pointer' onClick={() => { copyText(item.username) }}>
                      <img className='w-3 mt-2 ml-2' src="./public/icons/copy.png" alt="" />

                    </div>
                  </div>
                </td>
                <td className='py-2 border border-white text-center'>
                  <div className='flex items-center justify-center '>
                    <span>{"*".repeat(item.password.length)}</span>
                    <div className='lordiconcopy size-7 cursor-pointer' onClick={() => { copyText(item.password) }}>
                      <img className='w-3 mt-2 ml-2' src="./public/icons/copy.png" alt="" />

                    </div>
                  </div>
                </td>
                <td className='justify-center py-2 border border-white text-center flex'>
                  <span className='cursor-pointer mx-1' onClick={() => { editPassword(item.id) }}>
                    <img className='w-3 mt-2 ml-2' src="./public/icons/edit-text.png" alt="" />

                  </span>
                  <span className='cursor-pointer mx-1' onClick={() => { deletePassword(item.id) }}>
                    <img className='w-3 mt-2 ml-2' src="./public/icons/trash.png" alt="" />

                  </span>
                </td>
              </tr>

            })}
          </tbody>
        </table>}
      </div>
      <ToastContainer />
    </div>
  )
}

export default Passmanage
