import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// -----------------------------------------------------
// ¡¡¡IMPORTANTE!!!
// REEMPLAZA ESTO CON TUS PROPIAS LLAVES DE SUPABASE
const SUPABASE_URL = 'https://ohtlxyrwabjmrrnukcjv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odGx4eXJ3YWJqbXJybnVrY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDYyMjksImV4cCI6MjA3Mjg4MjIyOX0.YP7S-vIPk0NLmRR0fPhK2XBvJSqwqANyieadqWYqFxc';
// -----------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Muestra un mensaje en los formularios de autenticación.
 */
function showAuthMessage(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.className = isError ? 'text-red-500 text-sm mt-2' : 'text-green-500 text-sm mt-2';
    }
}

/**
 * Lógica principal de enrutamiento y protección de páginas.
 */
async function handlePageLoad() {
    const { data: { session } } = await supabase.auth.getSession();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const authPages = ['login.html', 'signup.html'];
    const protectedPages = ['dashboard.html'];

    if (protectedPages.includes(currentPage) && !session) {
        window.location.replace('login.html');
        return;
    }

    if (authPages.includes(currentPage) && session) {
        window.location.replace('dashboard.html');
        return;
    }

    initializePageLogic(currentPage, session);
}

/**
 * Ejecuta el código específico para la página actual.
 */
function initializePageLogic(page, session) {
    // Inicializa iconos en todas las páginas
    lucide.createIcons();
    
    switch (page) {
        case 'signup.html':
            setupSignupForm();
            break;
        case 'login.html':
            setupLoginForm();
            break;
        case 'dashboard.html':
            if (session) {
                setupDashboard(session.user);
            }
            break;
    }
}

// --- LÓGICA DE AUTENTICACIÓN ---

function setupSignupForm() {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = event.target.email.value;
        const password = event.target.password.value;
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) showAuthMessage('auth-message', error.message, true);
        else showAuthMessage('auth-message', '¡Registro exitoso! Revisa tu correo para activar tu cuenta.');
    });
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = event.target.email.value;
        const password = event.target.password.value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) showAuthMessage('auth-message', error.message, true);
        else window.location.href = 'dashboard.html';
    });
}

// --- LÓGICA DEL DASHBOARD (COMPLETA) ---

function setupDashboard(user) {
    const userEmailEl = document.getElementById('user-email');
    const welcomeMessageEl = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-btn');
    const createLinkBtn = document.getElementById('create-link-btn');
    const createLinkModal = document.getElementById('create-link-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const createLinkForm = document.getElementById('create-link-form');
    const linksTableBody = document.getElementById('links-table-body');
    const modalMessage = document.getElementById('modal-message');

    // Cargar datos iniciales
    if (userEmailEl) userEmailEl.textContent = user.email;
    if (welcomeMessageEl) welcomeMessageEl.textContent = `Bienvenido, ${user.email.split('@')[0]}`;
    fetchData();

    // Event Listeners
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    }
    
    if (createLinkBtn) createLinkBtn.addEventListener('click', () => createLinkModal.classList.remove('hidden'));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => createLinkModal.classList.add('hidden'));

    if (createLinkForm) {
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
                .insert([{ user_id: user.id, title, slug, destination_url }]);

            if (error) {
                showAuthMessage('modal-message', `Error: ${error.message}`, true);
            } else {
                showAuthMessage('modal-message', '¡Link creado con éxito!');
                fetchData(); // Recargar la tabla
                setTimeout(() => {
                    createLinkModal.classList.add('hidden');
                    createLinkForm.reset();
                    modalMessage.textContent = '';
                }, 1500);
            }
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar Link';
        });
    }

    async function fetchData() {
        if (!linksTableBody) return;
        linksTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-10 text-gray-500">Cargando tus links...</td></tr>`;

        const { data: links, error } = await supabase
            .from('links')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            linksTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-6 text-red-500">Error al cargar los links.</td></tr>`;
        } else if (links.length === 0) {
            linksTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-10 text-gray-500">No has creado ningún link todavía. ¡Crea el primero!</td></tr>`;
        } else {
            renderLinks(links);
        }
    }

    function renderLinks(links) {
        linksTableBody.innerHTML = '';
        links.forEach(link => {
            const linkUrl = `zipp.so/l/${link.slug}`;
            const linkRowHtml = `
                <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                    <td class="px-6 py-4"><div class="font-bold">${link.title}</div><div class="text-xs text-gray-400">${linkUrl}</div></td>
                    <td class="px-6 py-4 text-gray-300 truncate max-w-xs">${link.destination_url}</td>
                    <td class="px-6 py-4 text-center font-medium">0</td>
                    <td class="px-6 py-4 text-center"><span class="px-2 py-1 text-xs rounded-full ${link.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}">${link.is_active ? 'Activo' : 'Inactivo'}</span></td>
                    <td class="px-6 py-4"><div class="flex space-x-2"><button title="Copiar link" class="text-gray-400 hover:text-white"><i data-lucide="copy" class="w-4 h-4"></i></button><button title="Eliminar" class="text-gray-400 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div></td>
                </tr>
            `;
            linksTableBody.insertAdjacentHTML('beforeend', linkRowHtml);
        });
        lucide.createIcons();
    }
}

// --- PUNTO DE ENTRADA ---
document.addEventListener('DOMContentLoaded', handlePageLoad);
