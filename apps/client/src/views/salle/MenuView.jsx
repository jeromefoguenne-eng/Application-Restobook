import React from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { Utensils, CheckCircle2, XCircle } from 'lucide-react';

export const MenuView = () => {
  const { menuCategories, menuItems } = useRestobook();

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-950 overflow-y-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5 text-yellow-400" />
            Carte & Tarifs du Restaurant
          </h2>
          <p className="text-xs text-slate-400">Consultation des articles, prix TTC et gestion des disponibilités</p>
        </div>
      </div>

      <div className="space-y-6">
        {menuCategories.map(cat => {
          const items = menuItems.filter(i => i.categoryId === cat.id);
          return (
            <div key={cat.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
              <h3 className="text-base font-bold text-yellow-400 flex items-center gap-2 mb-4">
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-xs text-slate-500 font-normal">({items.length} articles)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-white">{item.name}</h4>
                        <span className="font-black text-yellow-400 font-mono text-sm whitespace-nowrap">
                          {item.price.toFixed(2)} €
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      {item.allergens?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.allergens.map((alg, aIdx) => (
                            <span key={aIdx} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                              {alg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-3">
                      <span className="text-[10px] text-slate-500 font-medium">TVA {item.vatRate || 10}%</span>
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> En stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
