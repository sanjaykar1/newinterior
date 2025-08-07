
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAlbbfGsOexu2NGRbhKfBX3dBn7ypn6Yks",
  authDomain: "homecarpent.firebaseapp.com",
  projectId: "homecarpent",
  storageBucket: "homecarpent.appspot.com",
  messagingSenderId: "972665678756",
  appId: "1:972665678756:web:32b570f46969f61162af31",
  measurementId: "G-7ZC4DE9YGV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export default function Home() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timeline, setTimeline] = useState("");
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [userType, setUserType] = useState("customer");
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    fetchProfiles();
  }, []);

  const login = () => signInWithEmailAndPassword(auth, email, password);
  const signup = () => createUserWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  const uploadFile = async (file) => {
    const fileRef = ref(storage, `uploads/${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const createProfile = async () => {
    const photoUrls = await Promise.all([...photos].map(uploadFile));
    const videoUrl = video ? await uploadFile(video) : "";
    await addDoc(collection(db, "profiles"), {
      name,
      description,
      timeline,
      userType,
      photoUrls,
      videoUrl,
    });
    fetchProfiles();
  };

  const fetchProfiles = async () => {
    const q = query(collection(db, "profiles"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => doc.data());
    setProfiles(data);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Interior Designers & Carpenters Platform</h1>

      {!user ? (
        <div>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={login}>Login</button>
          <button onClick={signup}>Sign Up</button>
        </div>
      ) : (
        <div>
          <p>Logged in as: {user.email}</p>
          <button onClick={logout}>Logout</button>

          {userType === "customer" ? (
            <div>
              {profiles.map((p, i) => (
                <div key={i}>
                  <h2>{p.name}</h2>
                  <p>{p.description}</p>
                  <p>Timeline: {p.timeline}</p>
                  {p.photoUrls.map((url, j) => (
                    <img key={j} src={url} width="100" />
                  ))}
                  {p.videoUrl && <video controls width="300" src={p.videoUrl} />}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <input placeholder="Timeline" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
              <input type="file" multiple onChange={(e) => setPhotos(e.target.files)} />
              <input type="file" onChange={(e) => setVideo(e.target.files[0])} />
              <button onClick={createProfile}>Create Profile</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
