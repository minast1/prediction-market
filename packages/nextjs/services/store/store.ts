import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import scaffoldConfig from "~~/scaffold.config";
import { ChainWithAttributes, NETWORKS_EXTRA_DATA } from "~~/utils/scaffold-eth";

/**
 * Zustand Store
 *
 * You can add global state to the app using this useGlobalState, to get & set
 * values from anywhere in the app.
 *
 * Think about it as a global useState.
 */

type GlobalState = {
  targetNetwork: ChainWithAttributes;
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => void;
  correctPredictions: number;
  setCorrectPredictions: (correctPredictions: number) => void;
};

export const useGlobalState = create<GlobalState>()(
  persist(
    set => ({
      targetNetwork: {
        ...scaffoldConfig.targetNetworks[0],
        ...NETWORKS_EXTRA_DATA[scaffoldConfig.targetNetworks[0].id],
      },
      correctPredictions: 0,
      setCorrectPredictions: (correctPredictions: number) => set(() => ({ correctPredictions })),
      setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => set(() => ({ targetNetwork: newTargetNetwork })),
    }),
    {
      storage: createJSONStorage(() => localStorage),
      name: "win-accuracy",
      partialize: state => ({
        //targetNetwork: state.targetNetwork,
        correctPredictions: state.correctPredictions,
      }),
    },
  ),
);
