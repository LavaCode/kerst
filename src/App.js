import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import './App.css';
import MicrolinkCard from '@microlink/react';

const App = () => {
  const [recipeList, setRecipeList] = useState([]);
  const [userIp, setUserIp] = useState(null);
  const [isAddRecipeVisible, setIsAddRecipeVisible] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    category: 'Amuse',
    submitter: '',
    url: '',
    thumbnail: '',
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({
    username: '',
    password: '',
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    const fetchUserIp = async () => {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setUserIp(data.ip);
    };
    fetchUserIp();

    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'recipes'));
        const recipes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecipeList(recipes);
      } catch (error) {
        console.error('Error fetching data from Firebase', error);
      }
    };

    fetchData();
  }, []);

  const handleAddRecipeSubmit = async (e) => {
    e.preventDefault();

    try {
      const newRecipeWithId = { ...newRecipe, likes: 0, likedByUser: false, voters: [] };
      const docRef = await addDoc(collection(db, 'recipes'), newRecipeWithId);

      setRecipeList([...recipeList, { id: docRef.id, ...newRecipeWithId }]);

      setNewRecipe({
        title: '',
        description: '',
        category: 'Amuse',
        submitter: '',
        url: '',
        thumbnail: '',
      });
      setIsAddRecipeVisible(false);
    } catch (error) {
      console.error('Error adding recipe to Firebase', error);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    const storedUsername = process.env.REACT_APP_USERNAME;
    const storedPassword = process.env.REACT_APP_PASSWORD;

    if (loginCredentials.username === storedUsername && loginCredentials.password === storedPassword) {
      setIsLoggedIn(true);
      setShowLoginModal(false);
    } else {
      alert('OH-ho-ho! De verkeerde gegevens!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLoginModal(false);
    setIsAddRecipeVisible(false);
  };

  const handleDeleteRecipe = async (id) => {
    try {
      await deleteDoc(doc(db, 'recipes', id));
      setRecipeList((prevList) => prevList.filter((recipe) => recipe.id !== id));
    } catch (error) {
      console.error('Error deleting recipe', error);
    }
  };

  const handleEditRecipe = (id) => {
    if (!isLoggedIn) return;
    const recipeToEdit = recipeList.find((recipe) => recipe.id === id);
    setNewRecipe(recipeToEdit);
    setIsAddRecipeVisible(true);
    setRecipeList((prevList) => prevList.filter((recipe) => recipe.id !== id));
  };

  const handleLike = async (id) => {
    if (!userIp) return;

    const recipeToUpdate = recipeList.find((recipe) => recipe.id === id);

    if (recipeToUpdate) {
      const voters = Array.isArray(recipeToUpdate.voters) ? recipeToUpdate.voters : [];
      const hasVoted = voters.includes(userIp);

      if (hasVoted) {
        const updatedLikes = recipeToUpdate.likes > 0 ? recipeToUpdate.likes - 1 : 0;
        const updatedVoters = voters.filter((voter) => voter !== userIp);

        const updatedRecipes = recipeList.map((recipe) =>
          recipe.id === id
            ? { ...recipe, likes: updatedLikes, voters: updatedVoters }
            : recipe
        );
        setRecipeList(updatedRecipes);

        try {
          await updateDoc(doc(db, 'recipes', id), {
            likes: updatedLikes,
            voters: updatedVoters,
          });
        } catch (error) {
          console.error('Error updating likes in Firebase', error);
        }
      } else {
        const updatedLikes = recipeToUpdate.likes + 1;
        const updatedVoters = [...voters, userIp];

        const updatedRecipes = recipeList.map((recipe) =>
          recipe.id === id
            ? { ...recipe, likes: updatedLikes, voters: updatedVoters }
            : recipe
        );
        setRecipeList(updatedRecipes);

        try {
          await updateDoc(doc(db, 'recipes', id), {
            likes: updatedLikes,
            voters: updatedVoters,
          });
        } catch (error) {
          console.error('Error updating likes in Firebase', error);
        }
      }
    }
  };

  const categories = ['Amuse', 'Voor', 'Hoofd', 'Na'];

  return (
    <div className="App">
      <header>
        <h1>Kerstrecepten!</h1>
      </header>

      {!isLoggedIn && (
        <button
          className="login-button"
          onClick={() => setShowLoginModal(true)}
          style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}
        >
          Login
        </button>
      )}

      {isLoggedIn && (
        <button
          className="logout-button"
          onClick={handleLogout}
          style={{ position: 'absolute', top: '10px', right: '100px', zIndex: 10 }}
        >
          Logout
        </button>
      )}

      {showLoginModal && (
        <div className="login-modal">
          <div className="login-modal-content">
            <h2>Admin Login</h2>
            <form onSubmit={handleLoginSubmit}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={loginCredentials.username}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, username: e.target.value })}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={loginCredentials.password}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                required
              />
              <button type="submit">Login</button>
              <button type="button" onClick={() => setShowLoginModal(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        className="add-recipe-button"
        onClick={() => setIsAddRecipeVisible(!isAddRecipeVisible)}
      >
        {isAddRecipeVisible ? 'Annuleer' : 'Voeg recept toe'}
      </button>

      {isAddRecipeVisible && (
        <div className="add-recipe-form">
          <h2>{newRecipe.id ? 'Bewerk recept' : 'Voeg recept toe'}</h2>
          <form onSubmit={handleAddRecipeSubmit}>
            <input
              type="text"
              name="title"
              placeholder="Titel"
              value={newRecipe.title}
              onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
              required
            />
            <textarea
              name="description"
              placeholder="Omschrijving"
              value={newRecipe.description}
              onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
              required
              maxLength={75}
            />
            <input
              type="text"
              name="submitter"
              placeholder="Je naam"
              value={newRecipe.submitter}
              onChange={(e) => setNewRecipe({ ...newRecipe, submitter: e.target.value })}
              required
            />
            <select
              name="category"
              value={newRecipe.category}
              onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
              required
            >
              <option value="Amuse">Amuse</option>
              <option value="Voor">Voor</option>
              <option value="Hoofd">Hoofd</option>
              <option value="Na">Na</option>
            </select>
            <input
              type="url"
              name="url"
              placeholder="Link naar recept (optioneel)"
              value={newRecipe.url}
              onChange={(e) => setNewRecipe({ ...newRecipe, url: e.target.value })}
            />
            <button type="submit">{newRecipe.id ? 'Update recept' : 'Voeg toe'}</button>
          </form>
        </div>
      )}

      <main>
        {categories.map((category) => (
          <section key={category}>
            <h2 className="recipe-title">{category}</h2>
            <div className="recipe-list">
              {recipeList.filter((recipe) => recipe.category === category).length > 0 ? (
                recipeList
                  .filter((recipe) => recipe.category === category)
                  .map((recipe) => (
                    <div className="recipe-card" key={recipe.id}>
                      <div className="microlink-container">
                        <MicrolinkCard url={recipe.url} className="microlink-card" />
                      </div>

                      <div
                        className={`like-btn ${recipe.voters.includes(userIp) ? 'liked' : ''}`}
                        onClick={() => handleLike(recipe.id)}
                      >
                        <i className={`fas fa-heart ${recipe.voters.includes(userIp) ? 'liked' : ''}`}></i>
                      </div>

                      <div className="like-count">
                        <span>{recipe.likes} likes</span>
                      </div>

                      <div className="recipe-details">
                        <h4>{recipe.title}</h4>
                        <p>{recipe.description}</p>
                        <small>Submitted by: {recipe.submitter}</small>
                      </div>

                      {isLoggedIn && (
                        <div className="admin-actions">
                          <button onClick={() => handleEditRecipe(recipe.id)}>Edit</button>
                          <button onClick={() => handleDeleteRecipe(recipe.id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <p>Geen recepten beschikbaar in deze categorie.</p>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default App;
