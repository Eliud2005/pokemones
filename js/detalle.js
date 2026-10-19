console.log('✅ detalle.js cargado');

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);
    console.log('🔎 id:', id);

    if (!id || isNaN(id)) {
        document.getElementById('pokemon-detail').innerHTML =
            `<p>No se especificó un Pokémon válido. <a href="index.html">Volver</a></p>`;
        return;
    }

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok) throw new Error('Pokémon no encontrado');
        const data = await res.json();

        const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        const types = data.types.map(t => t.type.name).join(', ');
        const image = data.sprites.other['official-artwork'].front_default
            || data.sprites.front_default;

        document.title = `${name} - Pokémon PWA`;

        const img = document.getElementById('detail-img');
        const title = document.getElementById('detail-title');
        const desc = document.getElementById('detail-desc');
        const details = document.getElementById('detail-details');

        img.src = image;
        img.alt = name;
        title.textContent = name;
        desc.textContent = `Tipo: ${types}`;

        // Construir los bloques de detalle (misma lógica que coffee)
        const detailData = {
            'ID': data.id,
            'Tipos': types,
            'Habilidades': data.abilities.map(a => a.ability.name).join(', '),
            'Altura': `${data.height / 10} m`,
            'Peso': `${data.weight / 10} kg`,
            'Experiencia base': data.base_experience || 'N/A',
            'Estadísticas': data.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(' · ')
        };

        let html = '';
        for (const [key, value] of Object.entries(detailData)) {
            html += `<p><strong>${key}:</strong> ${value}</p>`;
        }
        details.innerHTML = html;

        console.log('✅ Datos pintados');

    } catch (error) {
        console.error('❌ Error:', error);
        document.getElementById('pokemon-detail').innerHTML =
            `<p>No se encontró el Pokémon con id "${id}". <a href="index.html">Volver</a></p>`;
    }
});