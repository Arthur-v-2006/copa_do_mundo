const fs = require('fs');

const copaDoMundo = [
    {
        nomeGrupo: "Grupo A",
        jogos: [
            {mandante: "México", visitante: "África do Sul", data: "11/06/2026", hora: "16:00"},
            {mandante: "Coreia do Sul", visitante: "Republica Tcheca", data: "11/06/2026", hora: "23:00"},
            {mandante: "Republica Tcheca", visitante: "África do Sul", data: "18/06/2026", hora: "13:00"},
            {mandante: "México", visitante: "Coreia do Sul", data: "18/06/2026", hora: "22:00"},
            {mandante: "Republica Tcheca", visitante: "México", data: "24/06/2026", hora: "22:00"},
            {mandante: "África do Sul", visitante: "Coreia do Sul", data: "24/06/2026", hora: "22:00"},
        ]
    },
    {
        nomeGrupo: "Grupo B",
        jogos: [
            {mandante: "Canadá", visitante: "Bósnia e Herzegovina", data: "12/06/2026", hora: "16:00"},
            {mandante: "Catar", visitante: "Suiça", data: "13/06/2026", hora: "16:00"},
            {mandante: "Suiça", visitante: "Bósnia e Herzegovina", data: "18/06/2026", hora: "16:00"},
            {mandante: "Canadá", visitante: "Catar", data: "18/06/2026", hora: "19:00"},
            {mandante: "Suiça", visitante: "Canadá", data: "24/06/2026", hora: "16:00"},
            {mandante: "Bósnia e Herzegovina", visitante: "Catar", data: "24/06/2026", hora: "16:00"},
        ]
    },
    {
        nomeGrupo: "Grupo C",
        jogos: [
            {mandante: "Brasil", visitante: "Marrocos", data: "13/06/2026", hora: "19:00"},
            {mandante: "Haiti", visitante: "Escócia", data: "13/06/2026", hora: "22:00"},
            {mandante: "Escócia", visitante: "Marrocos", data: "19/06/2026", hora: "19:00"},
            {mandante: "Brasil", visitante: "Haiti", data: "19/06/2026", hora: "21:30"},
            {mandante: "Escócia", visitante: "Brasil", data: "24/06/2026", hora: "19:00"},
            {mandante: "Marrocos", visitante: "Haiti", data: "24/06/2026", hora: "19:00"},
        ]
    },
    {
        nomeGrupo: "Grupo D",
        jogos: [
            {mandante: "Estados Unidos", visitante: "Paraguai", data: "12/06/2026", hora: "22:00"},
            {mandante: "Austrália", visitante: "Turquia", data: "14/06/2026", hora: "01:00"},
            {mandante: "Estados Unidos", visitante: "Austrália", data: "19/06/2026", hora: "16:00"},
            {mandante: "Turquia", visitante: "Paraguai", data: "20/06/2026", hora: "00:00"},
            {mandante: "Turquia", visitante: "Estados Unidos", data: "25/06/2026", hora: "23:00"},
            {mandante: "Paraguai", visitante: "Austrália", data: "25/06/2026", hora: "23:00"},
        ]
    },
    {
        nomeGrupo: "Grupo E",
        jogos: [
            {mandante: "Alemanha", visitante: "Curaçao", data: "14/06/2026", hora: "14:00"},
            {mandante: "Costa do Marfim", visitante: "Equador", data: "14/06/2026", hora: "20:00"},
            {mandante: "Alemanha", visitante: "Costa do Marfim", data: "20/06/2026", hora: "17:00"},
            {mandante: "Equador", visitante: "Curaçao", data: "20/06/2026", hora: "21:00"},
            {mandante: "Equador", visitante: "Alemanha", data: "25/06/2026", hora: "17:00"},
            {mandante: "Curaçao", visitante: "Costa do Marfim", data: "25/06/2026", hora: "17:00"},
        ]
    },
    {
        nomeGrupo: "Grupo F",
        jogos: [
            {mandante: "Holanda", visitante: "Japão", data: "14/06/2026", hora: "17:00"},
            {mandante: "Suécia", visitante: "Tunísia", data: "14/06/2026", hora: "23:00"},
            {mandante: "Holanda", visitante: "Suécia", data: "20/06/2026", hora: "14:00"},
            {mandante: "Tunísia", visitante: "Japão", data: "21/06/2026", hora: "01:00"},
            {mandante: "Tunísia", visitante: "Holanda", data: "25/06/2026", hora: "20:00"},
            {mandante: "Japão", visitante: "Suécia", data: "25/06/2026", hora: "20:00"},
        ]
    },
    {
        nomeGrupo: "Grupo G",
        jogos: [
            {mandante: "Bélgica", visitante: "Egito", data: "15/06/2026", hora: "16:00"},
            {mandante: "Irã", visitante: "Nova Zelândia", data: "15/06/2026", hora: "22:00"},
            {mandante: "Bélgica", visitante: "Irã", data: "21/06/2026", hora: "16:00"},
            {mandante: "Nova Zelândia", visitante: "Egito", data: "21/06/2026", hora: "22:00"},
            {mandante: "Nova Zelândia", visitante: "Bélgica", data: "27/06/2026", hora: "00:00"},
            {mandante: "Egito", visitante: "Irã", data: "27/06/2026", hora: "00:00"},
        ]
    },
    {
        nomeGrupo: "Grupo H",
        jogos: [
            {mandante: "Espanha", visitante: "Cabo Verde", data: "15/06/2026", hora: "13:00"},
            {mandante: "Arábia Saudita", visitante: "Uruguai", data: "15/06/2026", hora: "19:00"},
            {mandante: "Espanha", visitante: "Arábia Saudita", data: "21/06/2026", hora: "13:00"},
            {mandante: "Uruguai", visitante: "Cabo Verde", data: "21/06/2026", hora: "19:00"},
            {mandante: "Uruguai", visitante: "Espanha", data: "26/06/2026", hora: "21:00"},
            {mandante: "Cabo Verde", visitante: "Arábia Saudita", data: "26/06/2026", hora: "21:00"},
        ]
    },
    {
        nomeGrupo: "Grupo I",
        jogos: [
            {mandante: "França", visitante: "Senegal", data: "16/06/2026", hora: "16:00"},
            {mandante: "Iraque", visitante: "Noruega", data: "16/06/2026", hora: "19:00"},
            {mandante: "França", visitante: "Iraque", data: "22/06/2026", hora: "18:00"},
            {mandante: "Noruega", visitante: "Senegal", data: "22/06/2026", hora: "21:00"},
            {mandante: "Noruega", visitante: "França", data: "26/06/2026", hora: "16:00"},
            {mandante: "Senegal", visitante: "Iraque", data: "26/06/2026", hora: "16:00"},
        ]
    },
    {
        nomeGrupo: "Grupo J",
        jogos: [
            {mandante: "Argentina", visitante: "Argélia", data: "16/06/2026", hora: "22:00"},
            {mandante: "Áustria", visitante: "Jordânia", data: "17/06/2026", hora: "01:00"},
            {mandante: "Argentina", visitante: "Áustria", data: "22/06/2026", hora: "14:00"},
            {mandante: "Jordânia", visitante: "Argélia", data: "23/06/2026", hora: "00:00"},
            {mandante: "Jordânia", visitante: "Argentina", data: "27/06/2026", hora: "23:00"},
            {mandante: "Argélia", visitante: "Áustria", data: "27/06/2026", hora: "23:00"},
        ]
    },
    {
        nomeGrupo: "Grupo K",
        jogos: [
            {mandante: "Portugal", visitante: "Congo", data: "17/06/2026", hora: "14:00"},
            {mandante: "Uzbesquistão", visitante: "Colômbia", data: "17/06/2026", hora: "23:00"},
            {mandante: "Portugal", visitante: "Uzbesquistão", data: "23/06/2026", hora: "14:00"},
            {mandante: "Colômbia", visitante: "Congo", data: "23/06/2026", hora: "23:00"},
            {mandante: "Colômbia", visitante: "Portugal", data: "27/06/2026", hora: "20:30"},
            {mandante: "Congo", visitante: "Uzbesquistão", data: "27/06/2026", hora: "20:30"},
        ]
    },
    {
        nomeGrupo: "Grupo L",
        jogos: [
            {mandante: "Inglaterra", visitante: "Croácia", data: "17/06/2026", hora: "17:00"},
            {mandante: "Gana", visitante: "Panamá", data: "17/06/2026", hora: "20:00"},
            {mandante: "Inglaterra", visitante: "Gana", data: "23/06/2026", hora: "17:00"},
            {mandante: "Panamá", visitante: "Croácia", data: "23/06/2026", hora: "20:00"},
            {mandante: "Panamá", visitante: "Inglaterra", data: "27/06/2026", hora: "18:00"},
            {mandante: "Croácia", visitante: "Gana", data: "27/06/2026", hora: "18:00"},
        ]
    }
];

let dados = JSON.parse(fs.readFileSync('dados.json', 'utf8'));

// Format date
function formatDate(d) {
    const parts = d.split('/');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Update group matches
dados.fixtures.groupStage = [];
let matchIdCounter = 1;

copaDoMundo.forEach(g => {
    const groupId = g.nomeGrupo.replace("Grupo ", "");
    // Get team mapping
    const groupData = dados.groups.find(x => x.id === groupId);
    
    // We need to match names from script to codes.
    // Let's create a map based on order or name
    // Since names might differ slightly (e.g. Holanda vs Países Baixos, Republica Tcheca vs Tchéquia), 
    // let's do a manual map just in case or try to use the teams array directly since they should be in the same group.
    let teamMap = {};
    const scriptTeams = [...new Set(g.jogos.flatMap(j => [j.mandante, j.visitante]))];
    
    // Attempt mapping
    scriptTeams.forEach((st, i) => {
        // Just map them by assuming the teams in the script matches the teams in dados.json somehow, or just store the names if codes are too hard.
        // Actually, in app.js/dados.json they use home: "MEX", away: "RSA"
        // Let's create a hardcoded map of names from script to codes
        const codeMap = {
            "México": "MEX", "África do Sul": "RSA", "Coreia do Sul": "KOR", "Republica Tcheca": "CZE",
            "Canadá": "CAN", "Bósnia e Herzegovina": "BIH", "Catar": "QAT", "Suiça": "SUI",
            "Brasil": "BRA", "Marrocos": "MAR", "Haiti": "HAI", "Escócia": "SCO",
            "Estados Unidos": "USA", "Paraguai": "PAR", "Austrália": "AUS", "Turquia": "TUR",
            "Alemanha": "GER", "Curaçao": "CUW", "Costa do Marfim": "CIV", "Equador": "ECU",
            "Holanda": "NED", "Japão": "JPN", "Suécia": "SWE", "Tunísia": "TUN",
            "Bélgica": "BEL", "Egito": "EGY", "Irã": "IRN", "Nova Zelândia": "NZL",
            "Espanha": "ESP", "Cabo Verde": "CPV", "Arábia Saudita": "KSA", "Uruguai": "URU",
            "França": "FRA", "Senegal": "SEN", "Iraque": "IRQ", "Noruega": "NOR",
            "Argentina": "ARG", "Argélia": "ALG", "Áustria": "AUT", "Jordânia": "JOR",
            "Portugal": "POR", "Congo": "COD", "Uzbesquistão": "UZB", "Colômbia": "COL",
            "Inglaterra": "ENG", "Croácia": "CRO", "Gana": "GHA", "Panamá": "PAN"
        };
        teamMap[st] = codeMap[st];
    });

    let roundCounter = 1;
    g.jogos.forEach((j, i) => {
        let round = 1;
        if (i >= 2 && i <= 3) round = 2;
        if (i >= 4) round = 3;
        
        dados.fixtures.groupStage.push({
            id: groupId + (i + 1),
            group: groupId,
            round: round,
            date: formatDate(j.data),
            time: j.hora,
            home: teamMap[j.mandante],
            away: teamMap[j.visitante],
            score: { home: null, away: null }
        });
    });
});

// Update Knockout Matches
const knockoutData = [
    // 32 avos
    { id: "M73", phase: "32avos de final", homeSlot: "1E", awaySlot: "3A/B/C/D/F", date: "2026-06-29", time: "17:30" },
    { id: "M74", phase: "32avos de final", homeSlot: "1I", awaySlot: "3C/D/F/G/H", date: "2026-06-30", time: "18:00" },
    { id: "M75", phase: "32avos de final", homeSlot: "2A", awaySlot: "2B", date: "2026-06-28", time: "16:00" },
    { id: "M76", phase: "32avos de final", homeSlot: "1F", awaySlot: "2C", date: "2026-06-29", time: "22:00" },
    { id: "M77", phase: "32avos de final", homeSlot: "2K", awaySlot: "2L", date: "2026-07-02", time: "20:00" },
    { id: "M78", phase: "32avos de final", homeSlot: "1H", awaySlot: "2J", date: "2026-07-02", time: "16:00" },
    { id: "M79", phase: "32avos de final", homeSlot: "1D", awaySlot: "3B/E/F/I/J", date: "2026-07-01", time: "21:00" },
    { id: "M80", phase: "32avos de final", homeSlot: "1G", awaySlot: "3A/E/H/I/J", date: "2026-07-01", time: "17:00" },
    { id: "M81", phase: "32avos de final", homeSlot: "1C", awaySlot: "2F", date: "2026-06-29", time: "14:00" },
    { id: "M82", phase: "32avos de final", homeSlot: "2E", awaySlot: "2I", date: "2026-06-30", time: "14:00" },
    { id: "M83", phase: "32avos de final", homeSlot: "1A", awaySlot: "3C/E/F/H/I", date: "2026-06-30", time: "22:00" },
    { id: "M84", phase: "32avos de final", homeSlot: "1L", awaySlot: "3E/H/I/J/K", date: "2026-07-01", time: "13:00" },
    { id: "M85", phase: "32avos de final", homeSlot: "1J", awaySlot: "2H", date: "2026-07-03", time: "19:00" },
    { id: "M86", phase: "32avos de final", homeSlot: "2D", awaySlot: "2G", date: "2026-07-03", time: "15:00" },
    { id: "M87", phase: "32avos de final", homeSlot: "1B", awaySlot: "3E/F/G/I/J", date: "2026-07-03", time: "00:00" },
    { id: "M88", phase: "32avos de final", homeSlot: "1K", awaySlot: "3D/E/I/J/L", date: "2026-07-03", time: "22:30" },

    // Oitavas
    { id: "M89", phase: "Oitavas de final", homeSlot: "W-M74", awaySlot: "W-M77", date: "2026-07-04", time: "18:00" },
    { id: "M90", phase: "Oitavas de final", homeSlot: "W-M73", awaySlot: "W-M75", date: "2026-07-04", time: "14:00" },
    { id: "M91", phase: "Oitavas de final", homeSlot: "W-M83", awaySlot: "W-M84", date: "2026-07-06", time: "16:00" },
    { id: "M92", phase: "Oitavas de final", homeSlot: "W-M81", awaySlot: "W-M82", date: "2026-07-06", time: "21:00" },
    { id: "M93", phase: "Oitavas de final", homeSlot: "W-M76", awaySlot: "W-M78", date: "2026-07-05", time: "17:00" },
    { id: "M94", phase: "Oitavas de final", homeSlot: "W-M79", awaySlot: "W-M80", date: "2026-07-05", time: "21:00" },
    { id: "M95", phase: "Oitavas de final", homeSlot: "W-M86", awaySlot: "W-M88", date: "2026-07-07", time: "13:00" },
    { id: "M96", phase: "Oitavas de final", homeSlot: "W-M85", awaySlot: "W-M87", date: "2026-07-07", time: "17:00" },

    // Quartas
    { id: "M97", phase: "Quartas de final", homeSlot: "W-M89", awaySlot: "W-M90", date: "2026-07-09", time: "17:00" },
    { id: "M98", phase: "Quartas de final", homeSlot: "W-M93", awaySlot: "W-M94", date: "2026-07-10", time: "16:00" },
    { id: "M99", phase: "Quartas de final", homeSlot: "W-M91", awaySlot: "W-M92", date: "2026-07-11", time: "18:00" },
    { id: "M100", phase: "Quartas de final", homeSlot: "W-M95", awaySlot: "W-M96", date: "2026-07-11", time: "22:00" },

    // Semifinais
    { id: "M101", phase: "Semifinais", homeSlot: "W-M97", awaySlot: "W-M98", date: "2026-07-14", time: "16:00" },
    { id: "M102", phase: "Semifinais", homeSlot: "W-M99", awaySlot: "W-M100", date: "2026-07-15", time: "16:00" },

    // 3º Lugar
    { id: "M103", phase: "Disputa 3º Lugar", homeSlot: "L-M101", awaySlot: "L-M102", date: "2026-07-18", time: "18:00" },

    // Final
    { id: "M104", phase: "Final", homeSlot: "W-M101", awaySlot: "W-M102", date: "2026-07-19", time: "16:00" }
].map(k => ({ ...k, score: { home: null, away: null } }));

dados.fixtures.knockout = knockoutData;

fs.writeFileSync('dados.json', JSON.stringify(dados, null, 2));
console.log('dados.json updated successfully!');
