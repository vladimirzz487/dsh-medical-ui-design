/**
 * dsh-medical-ui-design — registers the `medical-desktop-ui-design` Skill.
 *
 * Scope is deliberately narrow: this plugin contributes knowledge, not new host
 * tools. It injects only `skills`, registers one skill, and returns a disposer
 * that unregisters it. A missing `ctx.skills` is logged and left as a no-op
 * rather than thrown, so an unexpected profile shape degrades to "no skill"
 * instead of failing plugin mount.
 *
 * @module dsh-medical-ui-design
 */
import { MEDICAL_UI_SKILL, MEDICAL_UI_SKILL_NAME } from './skill.js';

export const name = 'dsh-medical-ui-design';

export const inject = ['skills'];

export function apply(ctx) {
  const skills = ctx.skills;
  if (skills === undefined || typeof skills.register !== 'function') {
    ctx.logger?.warn?.(
      'dsh-medical-ui-design: ctx.skills.register is unavailable; the "%s" skill was NOT registered',
      MEDICAL_UI_SKILL_NAME,
    );
    return () => {};
  }

  const unregister = skills.register(MEDICAL_UI_SKILL);
  ctx.logger?.info?.('dsh-medical-ui-design: skill "%s" registered', MEDICAL_UI_SKILL_NAME);

  return () => {
    try {
      unregister?.();
    } catch (error) {
      ctx.logger?.warn?.('dsh-medical-ui-design: failed to unregister skill: %s', String(error));
    }
  };
}
