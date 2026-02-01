/**
 * Script para remover o perfil "Meu Perfil" do sistema
 * Execute este código no console do navegador ou inclua na página
 */

(function () {
    const PROFILE_ID = 'profile_1769897599738_mtk5fun01';

    // Função para remover perfil
    function removeProfile(profileId) {
        // Obter perfis existentes
        const profilesKey = 'ecofinance_profiles';
        const profiles = JSON.parse(localStorage.getItem(profilesKey) || '[]');

        // Verificar se o perfil existe
        const profileIndex = profiles.findIndex(p => p.id === profileId);
        if (profileIndex === -1) {
            console.log('Perfil não encontrado:', profileId);
            return { success: false, error: 'Perfil não encontrado' };
        }

        const profile = profiles[profileIndex];
        console.log('Removendo perfil:', profile.name);

        // Remover perfil da lista
        profiles.splice(profileIndex, 1);
        localStorage.setItem(profilesKey, JSON.stringify(profiles));

        // Remover dados do perfil do localStorage
        const keysToRemove = [
            `ecofinance_${profileId}_transactions`,
            `ecofinance_${profileId}_budgets`,
            `ecofinance_${profileId}_goals`,
            `ecofinance_${profileId}_notifications`
        ];

        keysToRemove.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                console.log('Removendo dados:', key);
                localStorage.removeItem(key);
            }
        });

        // Se o perfil ativo era o removido, atualizar
        const activeProfile = localStorage.getItem('ecofinance_active_profile');
        if (activeProfile === profileId) {
            localStorage.removeItem('ecofinance_active_profile');
            if (profiles.length > 0) {
                localStorage.setItem('ecofinance_active_profile', profiles[0].id);
                console.log('Novo perfil ativo definido:', profiles[0].name);
            }
        }

        console.log('Perfil removido com sucesso!');
        return { success: true, profileName: profile.name };
    }

    // Executar remoção
    const result = removeProfile(PROFILE_ID);

    if (result.success) {
        console.log('%c✓ Perfil "' + result.profileName + '" foi removido com sucesso!', 'color: green; font-weight: bold; font-size: 14px;');
        console.log('%cAtualize a página para ver as alterações.', 'color: gray;');
    } else {
        console.error('Erro ao remover perfil:', result.error);
    }
})();
