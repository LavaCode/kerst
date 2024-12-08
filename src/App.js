import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore'; 
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';

import './App.css';
import MicrolinkCard from '@microlink/react';

const App = () => {
  const [recipeList, setRecipeList] = useState([]);
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
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'recipes'));
        const recipes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
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
      const newRecipeWithId = { ...newRecipe, likes: 0, likedByUser: false };
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
      
      playSound();

    } catch (error) {
      console.error('Error adding recipe to Firebase', error);
    }
  };

  const playSound = () => {
    const sound = new Audio('/sounds/santa-hohoho.mp3');
    sound.play();
  };

  const handleAddRecipeChange = (e) => {
    const { name, value } = e.target;
    setNewRecipe({ ...newRecipe, [name]: value });
  };

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginCredentials({ ...loginCredentials, [name]: value });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginCredentials.username === 'admin' && loginCredentials.password === 'password') {
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
    const updatedRecipes = recipeList.map((recipe) => {
      if (recipe.id === id) {
        const updatedRecipe = {
          ...recipe,
          likedByUser: !recipe.likedByUser,
          likes: recipe.likedByUser ? recipe.likes - 1 : recipe.likes + 1,
        };
        updateDoc(doc(db, 'recipes', id), {
          likes: updatedRecipe.likes,
          likedByUser: updatedRecipe.likedByUser,
        });
        return updatedRecipe;
      }
      return recipe;
    });

    setRecipeList(updatedRecipes);
  };

  const categories = ['Amuse', 'Voor', 'Hoofd', 'Na'];

  const getTopFavorite = (category) => {
    const filteredRecipes = recipeList.filter((recipe) => recipe.category === category);
    const topFavorite = filteredRecipes.sort((a, b) => b.likes - a.likes)[0];
    return topFavorite;
  };

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
                onChange={handleLoginInputChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={loginCredentials.password}
                onChange={handleLoginInputChange}
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
        className="show-favorites-button"
        onClick={() => setShowFavorites(!showFavorites)}
        style={{ marginTop: '10px' }}
      >
        {showFavorites ? 'Verberg de favorieten' : 'Toon de favorieten'}
      </button>

      {showFavorites && (
        <section className="favorites-section">
          <h2>DE FAVORIETEN BOVEN IN HET KLASSEMENT</h2>
          <div className="favorites-row">
            {categories.map((category) => {
              const topFavorite = getTopFavorite(category);
              return (
                topFavorite && (
                  <div className="favorite-recipe-card" key={topFavorite.id}>
                    <h3>{topFavorite.title}</h3>
                    <p>{topFavorite.description}</p>
                    <p>{topFavorite.likes} likes</p>
                  </div>
                )
              );
            })}
          </div>
        </section>
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
              onChange={handleAddRecipeChange}
              required
            />
            <textarea
              name="description"
              placeholder="Omschrijving"
              value={newRecipe.description}
              onChange={handleAddRecipeChange}
              required
            />
            <input
              type="text"
              name="submitter"
              placeholder="Je naam"
              value={newRecipe.submitter}
              onChange={handleAddRecipeChange}
              required
            />
            <select
              name="category"
              value={newRecipe.category}
              onChange={handleAddRecipeChange}
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
              onChange={handleAddRecipeChange}
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
                      {recipe.url ? (
                        <div className="microlink-container">
                          <MicrolinkCard
                            url={recipe.url}
                            className="microlink-card"
                          />
                        </div>
                      ) : (
                        <div className="microlink-container">
                          <img
                            src="https://via.placeholder.com/400x200.png?text=No+URL"
                            alt="Recipe Preview"
                            className="microlink-card"
                          />
                        </div>
                      )}

                      <div
                        className={`like-btn ${recipe.likedByUser ? 'liked' : ''}`}
                        onClick={() => handleLike(recipe.id)}
                      >
                        <i className={`fas fa-heart ${recipe.likedByUser ? 'liked' : ''}`}></i>
                      </div>

                      <div className="like-count">
                        <span>{recipe.likes} likes</span>
                      </div>

                      <div className="recipe-details">
                        <h4>{recipe.title}</h4>
                        <p>{recipe.description}</p>
                        <small>Submitted by: {recipe.submitter}</small>
                        {isLoggedIn && (
                          <div className="admin-actions">
                            <button onClick={() => handleEditRecipe(recipe.id)}>Edit</button>
                            <button onClick={() => handleDeleteRecipe(recipe.id)}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="no-recipes-message">Nog geen recepten toegevoegd, begin NU!</p>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default App;
