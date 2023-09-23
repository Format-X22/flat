import { Injectable } from '@nestjs/common';
import { PostArgs, PostDto, PostListArgs } from './content.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostModel } from './content.model';

@Injectable()
export class ContentService {
    constructor(@InjectRepository(PostModel) private postRepo: Repository<PostModel>) {}

    async getPosts({ skip, limit }: PostListArgs): Promise<Array<PostDto>> {
        return this.postRepo.find({
            skip,
            take: limit,
            order: {
                date: 'DESC',
            },
        });
    }

    async addPost({ title, text, isHidden, date }: PostArgs): Promise<void> {
        const model = this.postRepo.create({
            title,
            text,
            isHidden,
            date: date || new Date(),
        });

        await this.postRepo.save([model]);
    }

    async editPost(id: number, { title, text, isHidden, date }: PostArgs): Promise<void> {
        const update: Partial<PostModel> = {};

        if (title) {
            update.title = title;
        }

        if (text) {
            update.text = text;
        }

        if (isHidden) {
            update.isHidden = isHidden;
        }

        if (date) {
            update.date = date;
        }

        await this.postRepo.update(id, update);
    }

    async deletePost(id: number): Promise<void> {
        await this.postRepo.delete(id);
    }
}
