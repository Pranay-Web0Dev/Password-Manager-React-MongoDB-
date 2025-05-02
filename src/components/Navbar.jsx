import React from 'react'

const Navbar = () => {
  return (
    <nav className='bg-slate-800 flex justify-around py-3'>
      <div className="logo text-xl font-bold">
        <span className='text-green-700'>&lt;</span>
        <span className='text-white'>Pass</span>
        <span className='text-green-700'>OP/&gt;</span>
        
      </div>
      <ul >
        <li className='flex gap-8 text-lg text-white'>
          <a href="/">home</a>
          <a href="/">About</a>
          <a href="/">Contact Us</a>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar
