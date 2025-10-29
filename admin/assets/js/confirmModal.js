// confirmModal.js - shared confirm modal helper
(function (global) {
    const ConfirmModal = {};

    // Ensure modal markup exists, create it if missing
    function ensureModal() {
        let container = document.getElementById('confirmModal');
        if (container) return container;

        container = document.createElement('div');
        container.id = 'confirmModal';
        container.className = 'confirm-modal modal fade';
        container.tabIndex = -1;
        container.setAttribute('role', 'dialog');
        container.setAttribute('aria-hidden', 'true');

        container.innerHTML = `
            <div class="confirm-modal-dialog modal-dialog modal-sm modal-dialog-centered" role="document">
                <div class="confirm-modal-content modal-content">
                    <div class="confirm-modal-header modal-header">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i id="confirmModalIcon" class="fa fa-question-circle" aria-hidden="true" style="font-size:20px;"></i>
                            <h5 class="confirm-modal-title modal-title" id="confirmModalTitle">Confirm</h5>
                        </div>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    </div>
                    <div class="confirm-modal-body modal-body" id="confirmModalBody"></div>
                    <div class="confirm-modal-footer modal-footer">
                        <button id="confirmModalCancel" type="button" class="btn btn-cancel">Cancel</button>
                        <button id="confirmModalOk" type="button" class="btn btn-confirm">OK</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Ensure inert behavior to avoid aria-hidden focus issues.
        // When the modal is shown, remove inert so focusable controls are accessible.
        // When hidden, set inert to prevent descendants from retaining focus.
        try {
            $(container).on('shown.bs.modal', () => {
                container.removeAttribute('aria-hidden');
                try { container.inert = false; } catch (e) { /* inert may not be supported */ }
                // focus OK button for keyboard users
                const ok = container.querySelector('#confirmModalOk');
                if (ok && typeof ok.focus === 'function') ok.focus();
            });
            $(container).on('hidden.bs.modal', () => {
                container.setAttribute('aria-hidden', 'true');
                try { container.inert = true; } catch (e) { /* ignore */ }
            });
        } catch (e) { /* ignore if jQuery/Bootstrap not present */ }

        return container;
    }

    function getEls() {
        const container = ensureModal();
        return {
            container,
            title: container.querySelector('#confirmModalTitle'),
            body: container.querySelector('#confirmModalBody'),
            icon: container.querySelector('#confirmModalIcon'),
            btnCancel: container.querySelector('#confirmModalCancel'),
            btnConfirm: container.querySelector('#confirmModalOk')
        };
    }

    // options: title, message (HTML allowed), confirmText, cancelText, onConfirm, singleButton, iconClass
    ConfirmModal.show = function (opts = {}) {
        const {
            title = 'Confirm',
            message = '',
            confirmText = 'OK',
            cancelText = 'Cancel',
            onConfirm = null,
            singleButton = false,
            iconClass = 'fa fa-question-circle',
            confirmClass = 'btn-confirm',
            cancelClass = 'btn-cancel'
        } = opts;

        const el = getEls();
        if (!el || !el.container) return Promise.reject(new Error('confirm modal not available'));

        el.title.textContent = title;
        el.body.innerHTML = message;
        el.icon.className = iconClass;

        // update text and classes
        el.btnConfirm.textContent = confirmText;
        el.btnCancel.textContent = cancelText;
        el.btnConfirm.className = 'btn ' + confirmClass;
        el.btnCancel.className = 'btn ' + cancelClass;

        // single button handling
        if (singleButton) {
            el.btnCancel.style.display = 'none';
        } else {
            el.btnCancel.style.display = '';
        }

        // replace nodes to clear listeners
        const newConfirm = el.btnConfirm.cloneNode(true);
        const newCancel = el.btnCancel.cloneNode(true);
        el.btnConfirm.parentNode.replaceChild(newConfirm, el.btnConfirm);
        el.btnCancel.parentNode.replaceChild(newCancel, el.btnCancel);

        // re-query
        const btnConfirm = document.getElementById('confirmModalOk');
        const btnCancel = document.getElementById('confirmModalCancel');

        return new Promise((resolve) => {
            btnCancel.addEventListener('click', function onCancel() {
                $(el.container).modal('hide');
                resolve(false);
            }, { once: true });

            btnConfirm.addEventListener('click', function onOk(ev) {
                $(el.container).modal('hide');
                try {
                    if (typeof onConfirm === 'function') onConfirm(ev);
                } catch (e) {
                    console.error('confirm callback error', e);
                }
                resolve(true);
            }, { once: true });

            $(el.container).modal('show');
        });
    };

    ConfirmModal.hide = function () {
        const el = getEls();
        if (el && el.container) $(el.container).modal('hide');
    };

    global.ConfirmModal = ConfirmModal;
})(window);
