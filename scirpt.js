// script.js
// Волейбольный тактический планшет
// Игроки НЕ исчезают из меню, клик по игроку на поле удаляет его
// Сетка по центру — игроки только в нижней половине

(function() {
    // Получаем DOM элементы
    const field = document.querySelector('.field');
    const playersMenu = document.querySelector('.players-container');
    const resetBtn = document.querySelector('.btn-container button:first-child');
    const defaultBtn = document.querySelector('.btn-container button:last-child');
    
    // Все игроки, которые сейчас на поле
    let playersOnField = [];
    
    // Drag & Drop переменные
    let dragEnabled = true;
    let draggedOriginal = null;
    let draggedClone = null;
    let isDragging = false;
    let startClientX = 0, startClientY = 0;
    let isFromMenu = false;
    
    // ---------- Вспомогательные функции ----------
    
    // Получить тип игрока по классам
    function getPlayerType(element) {
        if (element.classList.contains('s')) return 'S';
        if (element.classList.contains('op')) return 'OP';
        if (element.classList.contains('oh')) return 'OH';
        if (element.classList.contains('mb')) return 'MB';
        if (element.classList.contains('l')) return 'L';
        return 'OH';
    }
    
    // Получить цвет для типа игрока (используем CSS переменные)
    function getPlayerColor(type) {
        switch(type) {
            case 'S': return 'var(--s-color, #ff3300)';
            case 'OP': return 'var(--op-color, #ff0077)';
            case 'OH': return 'var(--oh-color, #008cff)';
            case 'MB': return 'var(--mb-color, #ffe600)';
            case 'L': return 'var(--l-color, #00fd00)';
            default: return '#ff0000';
        }
    }
    
    // Получить текст для типа игрока
    function getPlayerText(type) {
        switch(type) {
            case 'S': return 'S';
            case 'OP': return 'O';
            case 'OH': return 'OH';
            case 'MB': return 'MB';
            case 'L': return 'L';
            default: return '?';
        }
    }
    
    // Создать нового игрока для размещения на поле
    function createFieldPlayer(type, leftPx, topPx) {
        const player = document.createElement('div');
        const typeLower = type.toLowerCase();
        player.className = `player ${typeLower}`;
        player.textContent = getPlayerText(type);
        
        // Стили для позиционирования (используем px для точного позиционирования)
        player.style.position = 'absolute';
        player.style.left = leftPx + 'px';
        player.style.top = topPx + 'px';
        player.style.width = '50px';
        player.style.height = '50px';
        player.style.borderRadius = '50%';
        player.style.display = 'flex';
        player.style.alignItems = 'center';
        player.style.justifyContent = 'center';
        player.style.fontSize = '14px';
        player.style.fontWeight = '800';
        player.style.color = 'black';
        player.style.cursor = 'grab';
        player.style.zIndex = '100';
        player.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        player.style.transition = 'transform 0.05s';
        player.style.userSelect = 'none';
        player.style.backgroundColor = getPlayerColor(type);
        
        // Добавляем обработчики
        attachDragHandlers(player);
        player.addEventListener('click', (e) => {
            e.stopPropagation();
            removePlayerFromField(player);
        });
        
        return player;
    }
    
    // Удалить игрока с поля
    function removePlayerFromField(player) {
        if (player && player.parentNode === field) {
            player.remove();
            playersOnField = playersOnField.filter(p => p !== player);
        }
    }
    
    // Добавить игрока на поле
    function addPlayerToField(type, leftPx, topPx) {
        const newPlayer = createFieldPlayer(type, leftPx, topPx);
        field.appendChild(newPlayer);
        playersOnField.push(newPlayer);
        return newPlayer;
    }
    
    // Проверка, находится ли точка в нижней половине поля (ниже сетки)
    function isInBottomHalf(clientX, clientY) {
        const fieldRect = field.getBoundingClientRect();
        if (!fieldRect || fieldRect.width === 0) return false;
        const netY = fieldRect.top + fieldRect.height / 2;
        return clientX >= fieldRect.left && 
               clientX <= fieldRect.right && 
               clientY >= netY && 
               clientY <= fieldRect.bottom;
    }
    
    // Получить координаты для размещения игрока на поле
    function getValidFieldCoords(clientX, clientY) {
        const fieldRect = field.getBoundingClientRect();
        let left = clientX - fieldRect.left - 25;
        let top = clientY - fieldRect.top - 25;
        
        // Границы поля (нижняя половина)
        const minX = 5;
        const maxX = fieldRect.width - 55;
        const minY = fieldRect.height / 2 + 5;
        const maxY = fieldRect.height - 55;
        
        left = Math.max(minX, Math.min(left, maxX));
        top = Math.max(minY, Math.min(top, maxY));
        
        return { left, top };
    }
    
    // ---------- Drag & Drop Handlers ----------
    
    function onPointerDown(e) {
        if (!dragEnabled) return;
        
        let clientX, clientY;
        if (e.clientX !== undefined) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            return;
        }
        
        draggedOriginal = e.target.closest('.player');
        if (!draggedOriginal) return;
        
        e.preventDefault();
        
        isDragging = false;
        startClientX = clientX;
        startClientY = clientY;
        
        isFromMenu = playersMenu.contains(draggedOriginal);
        
        const rect = draggedOriginal.getBoundingClientRect();
        draggedClone = draggedOriginal.cloneNode(true);
        draggedClone.style.position = 'fixed';
        draggedClone.style.left = rect.left + 'px';
        draggedClone.style.top = rect.top + 'px';
        draggedClone.style.width = rect.width + 'px';
        draggedClone.style.height = rect.height + 'px';
        draggedClone.style.margin = '0';
        draggedClone.style.opacity = '0.8';
        draggedClone.style.zIndex = '9999';
        draggedClone.style.cursor = 'grabbing';
        draggedClone.style.pointerEvents = 'none';
        document.body.appendChild(draggedClone);
        
        draggedOriginal.style.opacity = '0.3';
        
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('touchend', onPointerUp);
    }
    
    function onPointerMove(e) {
        if (!draggedOriginal || !draggedClone) return;
        
        let clientX, clientY;
        if (e.clientX !== undefined) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            return;
        }
        
        if (!isDragging && (Math.abs(clientX - startClientX) > 5 || Math.abs(clientY - startClientY) > 5)) {
            isDragging = true;
        }
        
        if (isDragging) {
            e.preventDefault();
            draggedClone.style.left = (clientX - draggedClone.offsetWidth / 2) + 'px';
            draggedClone.style.top = (clientY - draggedClone.offsetHeight / 2) + 'px';
        }
    }
    
    function onPointerUp(e) {
        if (!draggedOriginal || !draggedClone) {
            cleanup();
            return;
        }
        
        let clientX, clientY;
        if (e.clientX !== undefined) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.changedTouches) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            cleanup();
            return;
        }
        
        if (isDragging && isInBottomHalf(clientX, clientY)) {
            const coords = getValidFieldCoords(clientX, clientY);
            
            if (isFromMenu) {
                const playerType = getPlayerType(draggedOriginal);
                addPlayerToField(playerType, coords.left, coords.top);
            } else {
                draggedOriginal.style.left = coords.left + 'px';
                draggedOriginal.style.top = coords.top + 'px';
            }
        }
        
        cleanup();
    }
    
    function cleanup() {
        if (draggedClone) {
            draggedClone.remove();
            draggedClone = null;
        }
        if (draggedOriginal) {
            draggedOriginal.style.opacity = '1';
            draggedOriginal = null;
        }
        isDragging = false;
        
        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('touchend', onPointerUp);
    }
    
    function attachDragHandlers(element) {
        element.removeEventListener('mousedown', onPointerDown);
        element.removeEventListener('touchstart', onPointerDown);
        element.addEventListener('mousedown', onPointerDown);
        element.addEventListener('touchstart', onPointerDown, { passive: false });
    }
    
    // ---------- Обработка игроков в меню ----------
    function initMenuPlayers() {
        const menuPlayers = document.querySelectorAll('.players-container .player');
        menuPlayers.forEach(player => {
            player.style.cursor = 'grab';
            player.style.position = 'relative';
            player.style.userSelect = 'none';
            player.style.touchAction = 'manipulation';
            attachDragHandlers(player);
        });
    }
    
    // ---------- Кнопка Reset: очистить поле ----------
    function resetField() {
        playersOnField.forEach(player => {
            if (player && player.parentNode === field) {
                player.remove();
            }
        });
        playersOnField = [];
    }
    
    // ---------- Кнопка Default: расстановка 5-1 ----------
    function setDefaultFormation() {
        resetField();
        
        const trySet = () => {
            const fieldRect = field.getBoundingClientRect();
            const width = fieldRect.width;
            const height = fieldRect.height;
            
            if (width === 0 || height === 0) {
                setTimeout(trySet, 50);
                return;
            }
            
            const netY = height / 2;
            const frontY = netY + 40;
            const backY = height - 50;
            
            const leftX = width * 0.2;
            const centerX = width * 0.5;
            const rightX = width * 0.8;
            
            // Передняя линия: OH (зона 4), MB (зона 3), OP (зона 2)
            addPlayerToField('OH', leftX - 25, frontY - 25);
            addPlayerToField('MB', centerX - 25, frontY - 25);
            addPlayerToField('OP', rightX - 25, frontY - 25);
            
            // Задняя линия: OH (зона 5), L (зона 6), S (зона 1)
            addPlayerToField('OH', leftX - 25, backY - 25);
            addPlayerToField('L', centerX - 25, backY - 25);
            addPlayerToField('S', rightX - 25, backY - 25);
        };
        
        setTimeout(trySet, 50);
    }
    
    // ---------- Наблюдение за изменениями в меню ----------
    function setupMenuObserver() {
        const observer = new MutationObserver(() => {
            initMenuPlayers();
        });
        observer.observe(playersMenu, { childList: true, subtree: true });
    }
    
    // ---------- Инициализация ----------
    function initField() {
        field.style.position = 'relative';
        field.style.touchAction = 'none';
        
        const style = document.createElement('style');
        style.textContent = `
            .field .player {
                cursor: grab;
                touch-action: none;
                transition: transform 0.05s ease;
                will-change: left, top;
            }
            .field .player:active {
                cursor: grabbing;
            }
            .players-container .player {
                cursor: grab;
                touch-action: manipulation;
                transition: transform 0.05s ease;
            }
            .players-container .player:active {
                cursor: grabbing;
            }
            .field {
                position: relative;
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    }
    
    function init() {
        initField();
        initMenuPlayers();
        setupMenuObserver();
        
        if (resetBtn) {
            resetBtn.addEventListener('click', resetField);
        }
        if (defaultBtn) {
            defaultBtn.addEventListener('click', setDefaultFormation);
        }
        
        // Обработчик ресайза для корректировки позиций (опционально)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // При ресайзе просто перерисовываем дефолт если поле пустое
                if (playersOnField.length === 0) {
                    setDefaultFormation();
                }
            }, 200);
        });
        
        setTimeout(setDefaultFormation, 100);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();