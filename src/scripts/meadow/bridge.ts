/** What the story overlay can ask of the meadow scene. Set by startMeadow once the scene is running; null while it is not (no WebGL, or not loaded yet). */
export type MeadowApi = {
  /** Tilt the camera up into a starfield (true) or settle back onto the meadow (false). Resolves when the move has finished. */
  setSpace(on: boolean, opts?: { instant?: boolean }): Promise<void>;
};

export const meadowBridge: { api: MeadowApi | null } = { api: null };
