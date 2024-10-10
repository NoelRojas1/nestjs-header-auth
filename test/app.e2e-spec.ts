import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Bookmark, User } from '@prisma/client';

describe('AppController (e2e)', () => {
  let app: NestExpressApplication;
  let newUserData = {
    firstName: 'test',
    lastName: 'user',
    password: '!12345#',
    email: `test.user+${Date.now()}@gmail.com`,
  };
  let accessToken: string;
  let refreshToken: string;
  let user: User;
  let newBookmarkData = {
    title: 'new bookmark',
    descriptions: 'this is a bookmark for tests',
    link: 'https://www.youtube.com/watch?v=GHTA143_b-s',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    // set up ejs as view engine
    app.setBaseViewsDir(join(__dirname, '..', 'views'));
    app.setViewEngine('ejs');

    // set up a static assets folder
    app.useStaticAssets(join(__dirname, '..', 'public'));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    it('/auth/register (POST) - should create account', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUserData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
    });

    it('/auth/register (POST) - should fail', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: newUserData.email, password: newUserData.password });

      expect(response.status).toBe(400);
    });

    it('/auth/login (POST) - should log user in', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: newUserData.email, password: newUserData.password });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
    });

    it('/auth/login (POST) - should fail', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: newUserData.email,
          password: newUserData.password + '12345',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Users', () => {
    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: newUserData.email, password: newUserData.password });

      accessToken = response.body.access_token;
      refreshToken = response.body.refresh_token;
    });

    describe('Get me', () => {
      it('/users (GET) - Should get user', async () => {
        const response = await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('firstName');
        expect(response.body).toHaveProperty('lastName');
        expect(response.body).toHaveProperty('email');

        user = response.body;
      });

      it('/users (GET) - unauthorized', async () => {
        const response = await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer access_token`);

        expect(response.status).toBe(401);
      });
    });

    describe('Edit user', () => {
      it('/users/edit/:id (PATCH) - should update a user', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/users/edit/${user.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ lastName: 'newLastName' });

        expect(response.status).toBe(200);
        expect(response.body.lastName).toBe('newLastName');
      });
    });
  });

  describe('Bookmarks', () => {
    let bookmark: Bookmark;

    describe('Create bookmark', () => {
      it('/bookmarks (POST) - should create a bookmark', async () => {
        const response = await request(app.getHttpServer())
          .post(`/bookmarks`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(newBookmarkData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('descriptions');
        expect(response.body).toHaveProperty('link');
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');

        bookmark = response.body;
      });
    });

    describe('Get bookmarks', () => {
      it('/bookmarks (GET) - should get all bookmarks that belongs to a user', async () => {
        const response = await request(app.getHttpServer())
          .get(`/bookmarks`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('title');
        expect(response.body[0]).toHaveProperty('descriptions');
        expect(response.body[0]).toHaveProperty('link');
        expect(response.body[0]).toHaveProperty('createdAt');
        expect(response.body[0]).toHaveProperty('updatedAt');
      });
    });

    describe('Get bookmark by id', () => {
      it('/bookmarks/:id (GET) - should get a bookmark by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/bookmarks/${bookmark.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('descriptions');
        expect(response.body).toHaveProperty('link');
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
      });
    });
    describe('Edit bookmark', () => {
      it('/bookmarks/:id (PATCH) - should update a bookmark', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/bookmarks/${bookmark.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'new title', descriptions: 'new description' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('title');
        expect(response.body.title).toBe('new title');
        expect(response.body).toHaveProperty('descriptions');
        expect(response.body.descriptions).toBe('new description');
      });
    });
    describe('Delete bookmark', () => {
      it('/bookmarks/:id (DELETE) - should delete a bookmark', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/bookmarks/${bookmark.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(204);
      });

      it('/bookmarks (GET) - should get empty bookmark', async () => {
        const response = await request(app.getHttpServer())
          .get(`/bookmarks`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(0);
      });
    });
  });
});
