// Full-featured React App with Profile Pictures, Filtering, Ratings, and Catalog + Search Bar
// Technologies: Next.js, Firebase (Auth, Firestore, Storage), Tailwind CSS

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
  updateDoc,
  doc
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";

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
  const [userType, setUserType] = useState("customer");
  const [profiles, setProfiles] = useState([]);
  const [filter, setFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortByTimeline, setSortByTimeline] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [timeline, setTimeline] = useState("");
  const [catalog, setCatalog] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    fetchProfiles();
  }, []);

  const login = async () => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async () => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const uploadFile = async (file) => {
    const fileRef = ref(storage, `uploads/${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const createProfile = async () => {
    const photoUrls = await Promise.all([...photos].map(uploadFile));
    const videoUrl = video ? await uploadFile(video) : "";
    const profilePicUrl = profilePic ? await uploadFile(profilePic) : "";

    await addDoc(collection(db, "profiles"), {
      name,
      description,
      location,
      catalog,
      timeline,
      userType,
      photoUrls,
      videoUrl,
      profilePicUrl,
      rating: 0,
      reviews: []
    });

    fetchProfiles();
  };

  const fetchProfiles = async () => {
    const q = query(collection(db, "profiles"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProfiles(data);
  };

  const addReview = async (id, newRating) => {
    const profileRef = doc(db, "profiles", id);
    const profile = profiles.find(p => p.id === id);
    const updatedReviews = [...(profile.reviews || []), newRating];
    const avgRating = updatedReviews.reduce((a, b) => a + b, 0) / updatedReviews.length;

    await updateDoc(profileRef, {
      reviews: updatedReviews,
      rating: avgRating.toFixed(1)
    });
    fetchProfiles();
  };

  let filteredProfiles = profiles.filter((p) =>
    (filter ? p.userType === filter : true) &&
    (searchTerm ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.catalog.toLowerCase().includes(searchTerm.toLowerCase()) : true)
  );
  if (sortByTimeline) {
    filteredProfiles = filteredProfiles.sort((a, b) => (a.timeline || "").localeCompare(b.timeline || ""));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-4xl font-extrabold text-center text-blue-800">
          Interior Designers & Carpenters Platform
        </h1>

        {!user ? (
          <Card className="shadow-lg border-2 border-blue-200">
            <CardContent className="space-y-4 mt-4">
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="flex gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={login}>Login</Button>
                <Button variant="outline" onClick={signup}>Sign Up</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center bg-white px-4 py-2 rounded shadow">
              <p className="text-gray-700 font-medium">Logged in as: {user.email}</p>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>

            {userType === "customer" && (
              <>
                <div className="flex gap-4 items-center flex-wrap">
                  <label>Filter by:</label>
                  <select onChange={(e) => setFilter(e.target.value)} className="p-2 border rounded">
                    <option value="">All</option>
                    <option value="designer">Interior Designer</option>
                    <option value="carpenter">Carpenter</option>
                  </select>
                  <label>Sort by timeline</label>
                  <input type="checkbox" onChange={(e) => setSortByTimeline(e.target.checked)} />
                  <Input placeholder="Search by name, location, catalog..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64" />
                </div>

                <div className="space-y-4">
                  {filteredProfiles.map((p, i) => (
                    <Card key={i} className="shadow-md border border-gray-200 bg-white">
                      <CardContent className="space-y-3 mt-4">
                        <div className="flex items-center gap-4">
                          {p.profilePicUrl && (
                            <img src={p.profilePicUrl} className="w-16 h-16 rounded-full object-cover border" />
                          )}
                          <div>
                            <h2 className="text-2xl font-semibold text-blue-700">{p.name}</h2>
                            <p className="text-sm text-gray-500">{p.location}</p>
                            <p className="text-yellow-600 font-medium">⭐ {p.rating || 0}/5</p>
                          </div>
                        </div>
                        <p className="text-gray-600">{p.description}</p>
                        <p className="text-sm text-gray-500">Timeline: {p.timeline}</p>
                        <p className="text-sm text-gray-500">Catalog: {p.catalog}</p>
                        <div className="flex space-x-2 overflow-x-auto">
                          {p.photoUrls.map((url, j) => (
                            <img key={j} src={url} className="w-32 h-32 rounded-lg object-cover shadow" />
                          ))}
                        </div>
                        {p.videoUrl && (
                          <video controls src={p.videoUrl} className="w-full max-w-lg rounded shadow-md" />
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button className="bg-green-600 hover:bg-green-700">Book Now</Button>
                          <Button variant="outline" onClick={() => addReview(p.id, Math.floor(Math.random() * 5) + 1)}>
                            Rate +1⭐
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {(userType === "designer" || userType === "carpenter") && (
              <Card className="shadow-md border-2 border-blue-100">
                <CardContent className="space-y-4 mt-4">
                  <Input placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                  <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                  <Input placeholder="Timeline" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
                  <Input placeholder="Catalog (e.g. Kitchen, Wardrobe, etc.)" value={catalog} onChange={(e) => setCatalog(e.target.value)} />
                  <Input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files[0])} />
                  <Input type="file" multiple onChange={(e) => setPhotos(e.target.files)} />
                  <Input type="file" onChange={(e) => setVideo(e.target.files[0])} />
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={createProfile}>Create Profile</Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
