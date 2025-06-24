const pokemon = document.querySelector(".poke-search");
const button = document.querySelector(".btn");
const pokemonGrid = document.querySelector(".container");
const modal = document.getElementById("pokemonModal");
const closeBtn = document.querySelector(".close-btn");
const darkBtn = document.querySelector(".dark");
const loader = document.querySelector(".loader");
const html = document.documentElement;

let theme = localStorage.getItem("data-theme");
if (theme) {
  html.setAttribute("data-theme", theme);
}

darkBtn.addEventListener("click", () => {
  const currentTheme = html.getAttribute("data-theme");
  let newTheme = currentTheme === "light" ? "dark" : "light";

  html.setAttribute("data-theme", newTheme);
  localStorage.setItem("data-theme", newTheme);
});

let pokemons = [];

// Type colors for badges
const typeColors = {
  normal: "#8f8f6b",
  fire: "#f73718",
  water: "#6891f0",
  electric: "#ebc52d",
  grass: "#5bbd4b",
  ice: "#81cff0",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#a187ed",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#8a522d",
  ghost: "#27242b",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B3b3b5",
  fairy: "#EE99AC",
};

// Create Pokemon grid
function pokeGrid(pokemonData) {
  let pokehtml = "";

  pokemonData.forEach((poke) => {
    // Get the main stats (HP, Attack, Defense)
    const mainStats = poke.stats.slice(0, 3).map((stat) => ({
      name: stat.stat.name,
      value: stat.base_stat,
    }));

    pokehtml += `
            <div class="poke-card">
                <div class="poke-header">
                    <div class="poke-id">
                        <span class="poke-id-label">#${String(poke.id).padStart(
                          2,
                          "0"
                        )}</span>
                    </div>
                    <div class="poke-type">
                        ${poke.types
                          .map(
                            (type) =>
                              `<span class="type-label" style="background-color: ${
                                typeColors[type.type.name]
                              }">${type.type.name}</span>`
                          )
                          .join("")}
                    </div>
                   
                </div>

                <div class="div-img">
                    <img class="poke-img" loading="lazy"
                        src="${
                          poke.sprites.other["official-artwork"]
                            .front_default || poke.sprites.front_default
                        }"
                        alt="${poke.name}"
                    />
                </div>
                <div class="poke-name">
                    <h3>${poke.name}</h3>
                </div>
                <div class="poke-desc">
                    <div class="stats">
                        ${mainStats
                          .map(
                            (stat) => `
                            <div class="stat" style="background-color: ${stat.color}20">
                                <span class="stat-name">${stat.name}:</span>
                                <span class="stat-value" style="color: ${stat.color}">${stat.value}</span>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
       
                </div>
                
            </div>`;
  });

  pokemonGrid.innerHTML = pokehtml;
}

// Fetch Pokemon data from API
async function getPokemon() {
  try {
    loader.classList.remove("hidden");

    const response = await fetch(
      "https://pokeapi.co/api/v2/pokemon?limit=1025"
    );
    const data = await response.json();

    // Fetch detailed information for each Pokemon
    const pokemonDetails = await Promise.all(
      data.results.map((pokemon) =>
        fetch(pokemon.url).then((res) => res.json())
      )
    );

    // Update the pokemons array with the detailed data
    pokemons = pokemonDetails;

    pokeGrid(pokemons);
  } catch (error) {
    console.error("Error fetching Pokemon:", error);
    pokemonGrid.innerHTML =
      '<p class="error">Error loading Pokemon. Please try again later.</p>';
  } finally {
    loader.classList.add("hidden");
  }
}

// Load Pokemon when page loads
window.addEventListener("DOMContentLoaded", () => {
  getPokemon();
});

// Search Pokemon
async function searchPokemon() {
  const searchVal = pokemon.value.toLowerCase().trim();
  if (!searchVal) return;

  try {
    // First try to find Pokemon by type
    const filteredByType = pokemons.filter((poke) => {
      return poke.types.some(
        (type) => type.type.name.toLowerCase() === searchVal
      );
    });

    if (filteredByType.length > 0) {
      pokeGrid(filteredByType);
      return;
    }

    // If no type match, try to find by name
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${searchVal}`
    );

    if (!response.ok) {
      throw new Error("Pokemon not found");
    }

    const data = await response.json();
    // Store the searched Pokemon in a separate variable
    const searchedPokemon = [data];
    pokeGrid(searchedPokemon);
  } catch (error) {
    console.error("Error fetching Pokemon:", error);
    pokemonGrid.innerHTML =
      '<p class="error">Pokemon not found. Please try again.</p>';
  }
}

button.addEventListener("click", (e) => {
  e.preventDefault();
  searchPokemon();
});

pokemon.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchPokemon();
  }
});

// Add type filter event listener
pokemonGrid.addEventListener("click", (e) => {
  if (e.target.classList.contains("type-label")) {
    e.stopImmediatePropagation();
    let type = e.target.textContent.toLowerCase();

    // Filter from the original pokemons array
    let typesName = pokemons.filter((poke) => {
      return poke.types.some((val) => {
        return val.type.name.toLowerCase() === type;
      });
    });

    if (typesName.length > 0) {
      pokeGrid(typesName);
    } else {
      pokemonGrid.innerHTML =
        '<p class="error">No Pokemon found of this type.</p>';
    }
  }
});

// Modal functionality
pokemonGrid.addEventListener("click", modalFunction);

// fetch Pokemon species data
async function getPokemonSpecies(pokemon) {
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${pokemon}`
    );
    if (!response.ok) throw new Error("Species not found");
    return await response.json();
  } catch (error) {
    console.error("Error fetching species:", error);
    return null;
  }
}

async function pokemonEvol(pokemon) {
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${pokemon}`
    );
    if (!response.ok) throw new Error("Species not found");
    const speciesData = await response.json();
    console.log(speciesData.evolution_chain);

    const evoData = await fetch(speciesData.evolution_chain.url);

    return await evoData.json();
  } catch (error) {
    console.error("Error fetching species:", error);
    return null;
  }
}

async function modalFunction(e) {
  const card = e.target.closest(".poke-card");
  if (card) {
    const pokemonId = card.querySelector(".poke-id-label").textContent.slice(1);
    const pokemon = pokemons.find((p) => p.id === parseInt(pokemonId));

    if (pokemon) {
      let pokeChain = [];
      // Fetch species data
      const speciesData = await getPokemonSpecies(pokemon.id);
      let pokeEvolution = await pokemonEvol(pokemon.id);
      pokeChain.push(pokeEvolution);
      console.log(pokeChain);
      let pokemonStatus = "Regular";
      if (speciesData) {
        if (speciesData.is_legendary) pokemonStatus = "Legendary";
        else if (speciesData.is_mythical) pokemonStatus = "Mythical";
      }

      const modalContent = `
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <div class="header-container">
                        <div class="modal-header">
                            <h2>${pokemon.name}</h2>
                        </div>
                
                        <div class="info">
                            <h3>more info</h3>
                        </div>
                    </div>
            
                    <div class="modal-body">
                        <div class="flex">
                            <div>
                                <img src="${
                                  pokemon.sprites.other["official-artwork"]
                                    .front_default ||
                                  pokemon.sprites.front_default
                                }" alt="${pokemon.name}"
                                class="modal-img" />
                            </div>
                
                            <div class="modal-types">
                                ${pokemon.types
                                  .map(
                                    (type) => `<span
                                class="type-label"
                                style="background-color: ${
                                  typeColors[type.type.name]
                                }"
                                >${type.type.name}</span
                                >`
                                  )
                                  .join("")}
                            </div>
                            <div class="body-stats">
                                <p>height: <span class="h">${
                                  pokemon.height / 10
                                } m</span></p>
                                <p>weight: <span class="h">${
                                  pokemon.weight / 10
                                } kg </span></p>
                            </div>

                            <div class="poke-category">
                                <div>
                                <h4>Evolution Chain:</h4>
                                </div>
                                ${pokeChain
                                  .map(({ chain }) => {
                                    const base = chain.species.name;
                                    const first =
                                      chain.evolves_to[0]?.species.name;
                                    const second =
                                      chain.evolves_to[0]?.evolves_to[0]
                                        ?.species.name;

                                    return `<div class="evolution-chain">
                                        ${base}
                                        ${
                                          first
                                            ? ` ---> ${first}`
                                            : " (No evolution)"
                                        }
                                        ${second ? ` ---> ${second}` : ""}
                                    </div>`;
                                  })
                                  .join("")}
                            </div>
                        </div>
            
                        <div class="info-container">
                            <div class="modal-stats">
                                <h4>stats:</h4>
                                ${pokemon.stats
                                  .map(
                                    (stat) => `
                                <div class="modal-stat">
                                    <span class="modal-stat-name">${stat.stat.name}:</span>
                                    <span class="modal-stat-value">${stat.base_stat}</span>
                                </div>
                                `
                                  )
                                  .join("")}
                            </div>
                        
                            <div class="ability">
                                <h4>abilities:</h4>
                                ${pokemon.abilities
                                  .map(
                                    (ability) => `
                                    <p class="${
                                      ability.is_hidden ? "hidden-ability" : ""
                                    }">
                                        ${ability.ability.name}
                                        ${ability.is_hidden ? " (hidden)" : ""}
                                    </p>`
                                  )
                                  .join("")}
                            </div>


                            <div><h4 class="gen">Generation ${Math.ceil(
                              pokemon.id / 151
                            )}</h4>
                            </div>
                        </div>
                    </div>

                    <div class="pokemon-status">
                    <h4><span class="status-${pokemonStatus.toLowerCase()}">${pokemonStatus}</span></h4>
                    </div>
                </div>
            `;

      modal.innerHTML = modalContent;
      modal.style.display = "block";
    }
  }
}

// Close modal when clicking the close button or outside the modal
modal.addEventListener("click", (e) => {
  if (e.target === modal || e.target.classList.contains("close-btn")) {
    modal.style.display = "none";
  }
});

// Close modal when pressing Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.style.display === "block") {
    modal.style.display = "none";
  }
});

// Back to Top Button functionality
const backToTopButton = document.getElementById("backToTop");

// Show button when user scrolls down 320px
window.addEventListener("scroll", () => {
  if (window.scrollY > 320) {
    backToTopButton.classList.add("visible");
  } else {
    backToTopButton.classList.remove("visible");
  }
});

// Scroll to top when button is clicked
backToTopButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});
