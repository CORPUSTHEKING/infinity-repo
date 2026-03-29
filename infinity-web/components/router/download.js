import { getManifest } from '../../assets/js/data.js';
import { renderCategoriesView } from '../categories.js';
import { bindCardActions, handleDownload } from '../cardActions.js';

/**
 * Recursively searches the script tree to find an item by its ID.
 */
function findItemById(data, id) {
    if (!data || !Array.isArray(data)) return null;

    for (const item of data) {
        if (item.id === id) return item;

        if (item.children && item.children.length > 0) {
            const found = findItemById(item.children, id);
            if (found) return found;
        }
    }
    return null;
}

export async function handleDownloadPageRoute(ui, config) {
    ui.setPageContent('<div class="inf-page"><p class="inf-loading">Loading script manifest...</p></div>');

    try {
        const manifestData = await getManifest();

        if (manifestData && manifestData.length > 0) {
            // 1. Paint the HTML to the DOM
            ui.setPageContent(renderCategoriesView(manifestData));

            // 2. Select the container holding the new buttons
            const mainContainer = document.querySelector('.inf-main');

            // 3. Bind the physical actions
            bindCardActions(mainContainer, {
                onAction: (action, itemId, cardNode) => {
                    if (action === 'download') {
                        const item = findItemById(manifestData, itemId);
                        if (item) {
                            handleDownload(item, config);
                        } else {
                            console.error(`[Infinity] Could not locate metadata for item ID: ${itemId}`);
                        }
                    }
                }
            });
        } else {
            ui.setPageContent('<div class="inf-page"><p>No scripts found. Please run the manifest generator.</p></div>');
        }
    } catch (error) {
        console.error("[Infinity] Failed to load download page data:", error);
        ui.setPageContent('<div class="inf-page"><p class="inf-error">Error loading downloads. Check console.</p></div>');
    }
}
