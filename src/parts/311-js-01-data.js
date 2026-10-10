      /* =========================================================
         1. PHYSICAL DATA — Redux Beta Kerbol system (KSP2)
         ========================================================= */
      const KERBOL = { name: 'Kerbol', mu: 1.1723328e18, radius: 261600000, color: '#ffd166' };
      const DEG = Math.PI / 180;

      const RAW_PLANETS = [
        {
          name: 'Moho', color: '#b98a56', a: 5263138304, e: 0.200, orientDeg: 85, m0Deg: 124.90, period: 2215754.5, mu: 1.6860938e11, radius: 250000, incl: 7.00,
          desc: 'The innermost planet: a small, cratered, metallic world on a fast but steeply eccentric and inclined orbit. Its plane change and capture costs make it deceptively expensive to reach despite sitting closest to Kerbol.'
        },
        {
          name: 'Eve', color: '#9c4fc4', a: 9832684544, e: 0.010, orientDeg: 15, m0Deg: 314.44, period: 5657995.7, mu: 8.1717302e12, radius: 700000, incl: 2.10,
          desc: 'A dense purple world wrapped in a thick atmosphere, with the deepest gravity well of any stock planet. Home to the moon Gilly. Reaching orbit from the surface is one of the hardest challenges in the game.'
        },
        {
          name: 'Kerbin', color: '#4b9eff', a: 13599840256, e: 0.000, orientDeg: 0, m0Deg: 180, period: 9203544.6, mu: 3.5316000e12, radius: 600000, incl: 0.00,
          desc: 'Homeworld of the Kerbals and the default reference body for every transfer in this tool. Perfectly circular orbit. Orbited by the Mun and Minmus.'
        },
        {
          name: 'Duna', color: '#c1531c', a: 20726155264, e: 0.051, orientDeg: 135.5, m0Deg: 348.60, period: 17315400.4, mu: 3.0136321e11, radius: 320000, incl: 0.06,
          desc: 'A rust-red desert world with a thin atmosphere — the classic first interplanetary destination. Its large moon Ike shares the same orbit around Kerbol.'
        },
        {
          name: 'Dres', color: '#9a9a9a', a: 40839348203, e: 0.145, orientDeg: 370, m0Deg: 110.74, period: 47893063.1, mu: 2.1484489e10, radius: 138000, incl: 5.00,
          desc: 'A small, heavily-cratered rocky world on an eccentric, inclined orbit in the asteroid-belt region of the system. Orbited by the Dresteroids Drast and Beyl.'
        },
        {
          name: 'Jool', color: '#4fae5b', a: 68773560320, e: 0.050, orientDeg: 52, m0Deg: 334.08, period: 104661432, mu: 2.82528e14, radius: 6000000, incl: 1.304,
          desc: 'A gas giant with a swirling green atmosphere and an enormous sphere of influence hosting five moons: Laythe, Vall, Tylo, Bop and Pol. Dominates the outer Kerbol system.'
        },
        {
          name: 'Eeloo', color: '#dfe8ec', a: 90118820000, e: 0.260, orientDeg: 310, m0Deg: 158.80, period: 156991880, mu: 7.4410815e10, radius: 210000, incl: 6.15,
          desc: 'A distant icy dwarf planet on the most eccentric, steeply inclined orbit of the stock planets — the outermost destination, and a serious test of a mission plan.'
        }
      ];

      const RAW_MOONS = [
        // Eve
        { name: 'Gilly', parent: 'Eve', color: '#bda892', a: 31500000, e: 0.55, orientDeg: 10, m0Deg: 0, period: 288600, incl: 12.0, radius: 13000, mu: 2.4868349e9, desc: 'Tiny captured asteroid orbiting Eve.' },
        // Kerbin
        { name: 'Mun', parent: 'Kerbin', color: '#bcbcbc', a: 12000000, e: 0.00, orientDeg: 0, m0Deg: 0, period: 138984, incl: 0.0, radius: 200000, mu: 6.5026800e10, desc: 'Kerbin\'s large, cratered primary moon.' },
        { name: 'Minmus', parent: 'Kerbin', color: '#9be5d0', a: 47000000, e: 0.00, orientDeg: 38, m0Deg: 0, period: 388380, incl: 6.0, radius: 60000, mu: 1.7658000e9, desc: 'Mint-green icy moon with flat salt flats.' },
        // Duna
        { name: 'Ike', parent: 'Duna', color: '#888888', a: 3200000, e: 0.03, orientDeg: 0, m0Deg: 0, period: 65518, incl: 0.2, radius: 130000, mu: 1.8568369e10, desc: 'Tidally locked moon orbiting Duna closely.' },
        // Dres
        { name: 'Drast', parent: 'Dres', color: '#8a877b', a: 43400, e: 0.00, orientDeg: 0, m0Deg: 0, period: 12312, incl: 0.0, radius: 1596, mu: 3.7392e6, desc: 'Tiny inner Dresteroid embedded in Dres debris and ring material.' },
        { name: 'Beyl', parent: 'Dres', color: '#6f6552', a: 8365000, e: 0.48, orientDeg: 0, m0Deg: 0, period: 1037016, incl: 216.0, radius: 4595, mu: 4.8695448e7, desc: 'Distant retrograde Dresteroid on a steep, eccentric orbit around Dres.' },
        // Jool
        { name: 'Laythe', parent: 'Jool', color: '#4ba3e3', a: 27184000, e: 0.00, orientDeg: 0, m0Deg: 0, period: 52980, incl: 0.0, radius: 500000, mu: 1.962000e12, desc: 'Ocean moon with breathable atmosphere.' },
        { name: 'Vall', parent: 'Jool', color: '#a8dadc', a: 43152000, e: 0.00, orientDeg: 0, m0Deg: 0, period: 105960, incl: 0.0, radius: 300000, mu: 2.2476e10, desc: 'Icy moon with cryovolcanic activity.' },
        { name: 'Tylo', parent: 'Jool', color: '#e0e1dd', a: 68500000, e: 0.00, orientDeg: 0, m0Deg: 0, period: 211920, incl: 0.025, radius: 600000, mu: 2.8253e12, desc: 'Large, airless moon with intense gravity.' },
        { name: 'Bop', parent: 'Jool', color: '#7f6a54', a: 128500000, e: 0.235, orientDeg: 10, m0Deg: 0, period: 544507, incl: 15.0, radius: 65000, mu: 1.221e9, desc: 'Small irregular brown moon on inclined orbit.' },
        { name: 'Pol', parent: 'Jool', color: '#eddcd2', a: 179890000, e: 0.17, orientDeg: 15, m0Deg: 0, period: 901902, incl: 4.25, radius: 44000, mu: 7.21e8, desc: 'Outermost yellowish spiky moon of Jool.' }
      ];

      const PLANETS = RAW_PLANETS.map(p => ({
        ...p,
        orient: p.orientDeg * DEG,
        m0: p.m0Deg * DEG,
        n: 2 * Math.PI / p.period
      }));

      const MOONS = RAW_MOONS.map(m => ({
        ...m,
        orient: m.orientDeg * DEG,
        m0: m.m0Deg * DEG,
        n: 2 * Math.PI / m.period
      }));

      const BODY_OPTIONS = PLANETS.flatMap(p => [
        { body: p, isMoon: false, label: p.name },
        ...MOONS.filter(m => m.parent === p.name).map(m => ({ body: m, isMoon: true, label: `- ${m.name}` }))
      ]);

      function findBody(name) {
        return PLANETS.find(p => p.name === name) || MOONS.find(m => m.name === name) || null;
      }

      function transferBodyFor(body) {
        return body && body.parent ? PLANETS.find(p => p.name === body.parent) : body;
      }

      function getMoonMu(moon) {
        if (!moon) return null;

        // If mu is already defined, use it
        if (moon.mu) return moon.mu;

        // Try to derive from orbital parameters (Kepler's third law: mu = 4π²a³/T²)
        if (moon.a && moon.period) {
          return Math.pow(moon.a, 3) * 4 * Math.PI * Math.PI / Math.pow(moon.period, 2);
        }

        // Fallback: use known moon mu values from KSP2
        const moonMuMap = {
          'Mun': 6.5026e10,
          'Minmus': 1.7658e9,
          'Ike': 1.8568e10,
          'Gilly': 8.289e7,
          'Tylo': 2.8253e12,
          'Vall': 2.2476e10,
          'Laythe': 1.962e12
        };

        return moonMuMap[moon.name] || 1e9;  // Default fallback
      }

