import type { Action } from 'svelte/action';
import { spring, tweened, type Spring, type Tweened } from 'svelte/motion';

export type TransitionOpts = {
	type?: 'spring' | 'tween';
	delay: number;
	delayChildren: number;
	staggerChildren: number;
	staggerDirection: number;
};

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

export type AnimateOpts = {
	x?: number;
	y?: number;
	scale?: number;
	opacity?: number;
	rotate?: number;
};

export type MotionProps = {
	animate: AnimateOpts | string;
	variants: {
		[key: string]: AnimateOpts & { transition: TransitionOpts };
	}
	transition?: SpringOpts | TweenOpts;
};

export const motion: Action<HTMLElement, MotionProps> = (node, props) => {
	const { transition } = props;

	const isVariant = typeof props.animate === 'string';

	const animationStores: (Tweened<AnimateOpts> | Spring<AnimateOpts>)[] = new Array(isVariant ? node.children.length + 1 : 1);
	const unsubscribers = new Array(isVariant ? node.children.length + 1 : 1);

	if (typeof props.animate === 'string') {
		props.animate = props.variants[props.animate];
	}

	// Animate root node
	animationStores[0] = transition?.type === 'tween' ? handleTween(node, props) : handleSpring(node, props);
	unsubscribers[0] = animationStores[0].subscribe(({ x, y, opacity, scale, rotate }) => {
		node.style.transform = `translate(${x}px, ${y}px) scale(${scale ?? 1}) rotate(${rotate ?? 0}deg)`;
		node.style.opacity = `${opacity ?? 1}`;
	});

	// Animate children
	if (isVariant) {
		for (let i = 1; i <= node.children.length; i++) {
			const child = node.children[i - 1] as HTMLElement;
			
			handleChild(child, props, i, animationStores, unsubscribers);

			// Animate subsequent children
			for (let j = 0; j <= child.children.length; j++) {
				if (!child.children[j]) {
					break;
				}
				const subChild = child.children[j] as HTMLElement;
				handleChild(subChild, props, i, animationStores, unsubscribers);
			}
		}		
	}

	return {
		update(newProps) {
			if (typeof newProps.animate === 'string') {
				newProps.animate = newProps.variants[newProps.animate];
				const { animate } = newProps;
				
				// reanimate root node
				animationStores[0].update((updated) => {
					return {
						x: animate?.x ?? updated.x,
						y: animate?.y ?? updated.y,
						opacity: animate?.opacity ?? updated.opacity,
						scale: animate?.scale ?? updated.scale,
						rotate: animate?.rotate ?? updated.rotate
					};
				});
			}
		},
		destroy() {
			unsubscribers.forEach((unsubscriber) => {
				unsubscriber();
			});
		}
	};
};

function handleChild(child: HTMLElement, props: MotionProps, i: number, animationStores: (Tweened<AnimateOpts> | Spring<AnimateOpts>)[], unsubscribers: (() => void)[]){
	const variantString = child.getAttribute('data-motion-variant');
	const { transition } = props;

	if (typeof props.animate !== 'string') {
		if (variantString) {
			let variant = JSON.parse(variantString);
			variant = {
				...variant,
				scale: variant.scale - (props.animate.scale === undefined ? 0 : props.animate.scale === 1 ? 0 : props.animate.scale),
				rotate: variant.rotate - (props.animate.rotate ?? 0),
			}
			animationStores[i] = transition?.type === 'tween' ? handleTween(child, { ...props, animate: variant }) : handleSpring(child, { ...props, animate: variant });
			unsubscribers[i] = animationStores[i].subscribe(({ x, y, opacity, scale, rotate }) => {
				child.style.transform = `translate(${x}px, ${y}px) scale(${scale ?? 1}) rotate(${rotate ?? 0}deg)`;
				child.style.opacity = `${opacity ?? 1}`;
			});
		}
	}
}

function handleTween(
	node: HTMLElement,
	props: MotionProps
): Tweened<AnimateOpts> {
	if (typeof props.animate === "string") {
		props.animate = props.variants[props.animate];
	}
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

		return values as Tweened<AnimateOpts>;
	} else {
		throw new Error('Incorrect Transition Type!');
	}
}

function handleSpring(
	node: HTMLElement,
	props: MotionProps
): Spring<AnimateOpts> {
	if (typeof props.animate === "string") {
		props.animate = props.variants[props.animate];
	}
	const { animate, transition } = props;

	if ((transition && transition.type === 'spring') || !transition?.type) {
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

		return values as Spring<AnimateOpts>;
	} else {
		throw new Error('Incorrect Transition Type!');
	}
}