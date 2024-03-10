import type { Action } from 'svelte/action';
import { spring, tweened, type Spring, type Tweened } from 'svelte/motion';

export type SpringOpts = {
	type?: 'spring';
	stiffness?: number;
	damping?: number;
	precision?: number;
};

export type TweenOpts = {
	type: 'tween';
	duration?: number;
	easing?: (t: number) => number;
};

export type MotionProps = {
	animate: {
		x?: number;
		y?: number;
		scale?: number;
		opacity?: number;
		rotate?: number;
	};
	transition?: SpringOpts | TweenOpts;
};

export const motion: Action<HTMLElement, MotionProps> = (node, props) => {
	const { transition } = props;

	console.log(props);

	const values =
		transition?.type === 'tween' ? handleTween(node, props) : handleSpring(node, props);

	const unsubscribe = values.subscribe(({ x, y, opacity, scale, rotate }) => {
		node.style.transform = `translate(${x}px, ${y}px) scale(${scale ?? 1}) rotate(${rotate ?? 0}deg)`;
		node.style.opacity = `${opacity ?? 1}`;
	});

	return {
		update(newProps) {
			const { animate } = newProps;
			values.update((updated) => {
				return {
					x: animate?.x ?? updated.x,
					y: animate?.y ?? updated.y,
					opacity: animate?.opacity ?? updated.opacity,
					scale: animate?.scale ?? updated.scale,
					rotate: animate?.rotate ?? updated.rotate
				};
			});
		},
		destroy() {
			unsubscribe();
		}
	};
};

function handleTween(
	node: HTMLElement,
	props: MotionProps
): Tweened<{
	x: number;
	y: number;
	opacity: number;
	scale: number;
	rotate: number;
}> {
	const { animate, transition } = props;

	if (transition && transition.type === 'tween') {
		const values = tweened(
			{
				x: 0,
				y: 0,
				opacity: 1,
				scale: 1,
				rotate: 0
			},
			{
				duration: transition.duration,
				easing: transition.easing
			}
		);

		values.update((updated) => {
			return {
				x: animate?.x ?? updated.x,
				y: animate?.y ?? updated.y,
				opacity: animate?.opacity ?? updated.opacity,
				scale: animate?.scale ?? updated.scale,
				rotate: animate?.rotate ?? updated.rotate
			};
		});

		return values;
	} else {
		throw new Error('Incorrect Transition Type!');
	}
}

function handleSpring(
	node: HTMLElement,
	props: MotionProps
): Spring<{
	x: number;
	y: number;
	opacity: number;
	scale: number;
	rotate: number;
}> {
	const { animate, transition } = props;

	if ((transition && transition.type === 'spring') || !transition) {
		const values = spring(
			{
				x: 0,
				y: 0,
				opacity: 1,
				scale: 1,
				rotate: 0
			},
			{
				damping: transition?.damping,
				stiffness: transition?.stiffness,
				precision: transition?.precision
			}
		);

		values.update((updated) => {
			return {
				x: animate?.x ?? updated.x,
				y: animate?.y ?? updated.y,
				opacity: animate?.opacity ?? updated.opacity,
				scale: animate?.scale ?? updated.scale,
				rotate: animate?.rotate ?? updated.rotate
			};
		});

		return values;
	} else {
		throw new Error('Incorrect Transition Type!');
	}
}