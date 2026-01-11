import DashboardLayout from '../../components/DashboardLayout';

export default function PlanetaryPositionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Planetary Positions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View current planetary positions and their astrological significance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Sun', symbol: '☉', sign: 'Aries', degree: '15°' },
            { name: 'Moon', symbol: '☽', sign: 'Cancer', degree: '28°' },
            { name: 'Mercury', symbol: '☿', sign: 'Taurus', degree: '8°' },
            { name: 'Venus', symbol: '♀', sign: 'Pisces', degree: '22°' },
            { name: 'Mars', symbol: '♂', sign: 'Leo', degree: '12°' },
            { name: 'Jupiter', symbol: '♃', sign: 'Sagittarius', degree: '18°' },
            { name: 'Saturn', symbol: '♄', sign: 'Capricorn', degree: '25°' },
            { name: 'Uranus', symbol: '♅', sign: 'Aquarius', degree: '10°' },
            { name: 'Neptune', symbol: '♆', sign: 'Pisces', degree: '5°' },
          ].map((planet) => (
            <div key={planet.name} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{planet.symbol}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{planet.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{planet.sign} {planet.degree}</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Currently positioned in {planet.sign}, influencing {planet.name.toLowerCase()}-related aspects of life.
              </p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

