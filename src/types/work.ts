type Work = {
	assets: Asset[];
	id: string;
	title: string;
	description: string;
	description_html: string;
	user_id: string;
	visibility: string;
	created_at: string;
	updated_at: string;
};

type Asset = {
	asset_type: string;
	created_at: Date;
	extension: string;
	updated_at: string;
	url: string;
	user_id: string;
	work_id: string;
};

export type { Work };
