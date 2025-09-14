import { useState } from "react";

import Switch from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Switch> = {
	title: "UI/Switch",
	component: Switch,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SwitchWithState = ({
	initialValue = true,
}: {
	initialValue?: boolean;
}) => {
	const [isToy, setIsToy] = useState(initialValue);
	return <Switch isToy={isToy} setIsToy={setIsToy} />;
};

export const ToySelected: Story = {
	render: () => <SwitchWithState initialValue={true} />,
};

export const BlogSelected: Story = {
	render: () => <SwitchWithState initialValue={false} />,
};
