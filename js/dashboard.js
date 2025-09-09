// js/dashboard.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// -----------------------------------------------------
// ¡¡¡IMPORTANTE!!!
// DEBEN SER LAS MISMAS LLAVES QUE EN auth.js
const SUPABASE_URL = 'https://ohtlxyrwabjmrrnukcjv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odGx4eXJ3YWJqbXJybnVrY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDYyMjksImV4cCI6MjA3Mjg4MjIyOX0.YP7S-vIPk0NLmRR0fPhK2XBvJSqwqANyieadqWYqFxc';
// -----------------------------------------------------

// --- INICIALIZACIÓN ---
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
lucide.createIcons();

// --- ELEMENTOS DEL DOM ---
const userEmailEl = document.getElementById('user-email');
const welcomeMessageEl = document.getElementById('welcome-message');
const logoutBtn = document.getElementById('logout-btn');
const createLinkBtn = document.getElementById('create-link-btn');
const createLinkModal = document.getElementById('create-link-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const createLinkForm = document.getElementById('create-link-form');
const linksTableBody = document.getElementById('links-table-body');
const modalMessage = document.getElementById('modal-message');

// --- DATOS DEL USUARIO ---
let currentUser = null;

// --- FUNCIONES ---

// Función para obtener los datos del perfil y los links
async function fetchData() {
    if (!currentUser) return;
    
    linksTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-10 text-gray-500">Cargando tus links...</td></tr>`;

    const { data: links, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching links:', error);
        linksTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-6 text-red-500">Error al cargar los links.</td></tr>`;
    } else if (links.length === 0) {
        linksTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-10 text-gray-500">No has creado ningún link todavía. ¡Crea el primero!</td></tr>`;
    } else {
        renderLinks(links);
    }
}

// Función para renderizar los links en la tabla
function renderLinks(links) {
    linksTableBody.innerHTML = '';
    links.forEach(link => {
        const linkUrl = `zipp.so/l/${link.slug}`; // Placeholder, usa tu dominio real en el futuro
        const linkRow = `
            <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                <td class="px-6 py-4">
                    <div class="font-bold">${link.title}</div>
                    <div class="text-xs text-gray-400">${linkUrl}</div>
                </td>
                <td class="px-6 py-4 text-gray-300 truncate max-w-xs">${link.destination_url}</td>
                <td class="px-6 py-4 text-center font-medium">0</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 text-xs rounded-full ${link.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}">
                        ${link.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex space-x-2">
                        <button title="Copiar link" onclick="navigator.clipboard.writeText('${linkUrl}')" class="text-gray-400 hover:text-white"><i data-lucide="copy" class="w-4 h-4"></i></button>
                        <button title="Editar" class="text-gray-400 hover:text-white"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        <button title="Eliminar" class="text-gray-400 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </td>
            </tr>
        `;
        linksTableBody.innerHTML += linkRow;
    });
    lucide.createIcons();
}

// --- MANEJO DE EVENTOS ---
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html'; // Usar rutas relativas
});

createLinkBtn.addEventListener('click', () => createLinkModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => createLinkModal.classList.add('hidden'));

createLinkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';

    const title = document.getElementById('link-title').value;
    const slug = document.getElementById('link-slug').value;
    const destination_url = document.getElementById('link-destination').value;
    
    const { error } = await supabase
        .from('links')
        .insert([{
            user_id: currentUser.id,
            title,
            slug,
            destination_url
        }]);

    if (error) {
        modalMessage.textContent = `Error: ${error.message}`;
        modalMessage.className = 'text-red-500 text-center mt-4 text-sm';
    } else {
        modalMessage.textContent = '¡Link creado con éxito!';
        modalMessage.className = 'text-green-500 text-center mt-4 text-sm';
        fetchData(); // Recargar los links para que aparezca el nuevo
        setTimeout(() => {
            createLinkModal.classList.add('hidden');
            createLinkForm.reset();
            modalMessage.textContent = '';
        }, 1500);
    }
    submitButton.disabled = false;
    submitButton.textContent = 'Guardar Link';
});

// --- INICIALIZACIÓN DE LA PÁGINA ---
async function initializePage() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html'; // Usar rutas relativas
        return;
    }
    
    currentUser = session.user;
    if (userEmailEl) userEmailEl.textContent = currentUser.email;
    if (welcomeMessageEl) welcomeMessageEl.textContent = `Bienvenido, ${currentUser.email.split('@')[0]}`;
    
    await fetchData();
}

initializePage();
