// js/pokemons.js
// Consume PokéAPI y expone un array `pokemons` compatible con app.js

const POKEAPI_BASE = 'https://pokeapi.co/api/v2/pokemon';
const POKEMON_LIMIT = 12; // cantidad a mostrar en el grid

let pokemons = [];

// Transforma la respuesta de PokéAPI a la estructura que espera app.js
function mapPokemonToCard(data) {
    const types = data.types.map(t => t.type.name).join(', ');
    return {
        id: data.id,
        title: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        image: data.sprites.other['official-artwork'].front_default
            || data.sprites.front_default,
        description: `Tipo: ${types} · Altura: ${data.height / 10} m · Peso: ${data.weight / 10} kg`,
        // Datos completos para el detalle
        details: {
            id: data.id,
            types: types,
            abilities: data.abilities.map(a => a.ability.name).join(', '),
            height: `${data.height / 10} m`,
            weight: `${data.weight / 10} kg`,
            baseExperience: data.base_experience || 'N/A',
            stats: data.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(' · ')
        }
    };
}

async function loadPokemons() {
    try {
        // 1. Obtener lista de IDs (usamos los primeros N Pokémon)
        const ids = Array.from({ length: POKEMON_LIMIT }, (_, i) => i + 1);

        // 2. Fetch en paralelo de cada Pokémon
        const responses = await Promise.all(
            ids.map(id => fetch(`${POKEAPI_BASE}/${id}`))
        );

        // 3. Verificar respuestas y parsear JSON
        const dataArray = await Promise.all(
            responses.map(async (res, i) => {
                if (!res.ok) throw new Error(`Error al cargar Pokémon ID ${ids[i]}`);
                return res.json();
            })
        );

        // 4. Mapear y asignar al array global
        pokemons = dataArray.map(mapPokemonToCard);
        console.log(`✅ ${pokemons.length} Pokémon cargados`);

    } catch (error) {
        console.error('❌ Error cargando Pokémon:', error);
        pokemons = []; // array vacío para que app.js no falle
    }
}

// Exponer función de carga (app.js la esperará)
window.loadPokemons = loadPokemons;