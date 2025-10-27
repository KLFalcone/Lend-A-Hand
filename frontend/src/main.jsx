import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Home from './pages/Home'
import Browse from './pages/Browse.jsx'
import PostRequest from './pages/PostRequest.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx';
import SpecificPost from "./pages/SpecificPost.jsx";

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "/browse",
        element: <Browse />
      },
      { 
        path: "browse/posts/:id", 
        element: <SpecificPost /> },
      {
        path: "/post",
        element: <PostRequest />
      },
      {
        path: "/register",
        element: <Register />
      },
      {
        path: "/login",
        element: <Login />
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/privacy",
        element: <Profile />,
      },
      {
        path: "/terms",
        element: <Profile />,
      },
      {
        path: "/support",
        element: <Profile />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
