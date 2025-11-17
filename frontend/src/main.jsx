// frontend/src/main.jsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

import Home from "./pages/Home.jsx";
import Browse from "./pages/Browse.jsx";
import PostRequest from "./pages/PostRequest.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import Support from "./pages/Support.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import SpecificPost from "./pages/SpecificPost.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },

      { path: "browse", element: <Browse /> },
      { path: "browse/posts/:id", element: <SpecificPost /> },

      { path: "post", element: <PostRequest /> },

      { path: "register", element: <Register /> },
      { path: "login", element: <Login /> },

      { path: "profile", element: <Profile /> },
      { path: "privacy", element: <Privacy /> },
      { path: "terms", element: <Terms /> },
      { path: "support", element: <Support /> },
      { path: "admin", element: <AdminDashboard /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
