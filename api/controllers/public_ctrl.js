import { db } from '../helpers/db.mongo';
import { objectid } from '../helpers/utils';
import {
  RESTErrorNotFound,
  RESTErrorForbidden,
  RESTErrorConflict,
} from '../helpers/errors';

const votingsCollection = () => db().collection('votings');
const votersCollection = () => db().collection('voters');

export async function getVotings(req, res, next) {
  try {
    const {
      offset: { value: offset },
      limit: { value: limit },
    } = req.swagger.params;
    const cursor = await votingsCollection().find(
      {},
      {
        skip: offset,
        limit: limit,
        sort: { _id: -1 },
      },
    );
    const total = await cursor.count();
    const votings = await cursor.toArray();
    res.json({
      total,
      offset,
      limit,
      nextOffset: votings.length > limit ? offset + limit : null,
      votings: votings.slice(0, limit),
    });
  } catch (e) {
    next(e);
  }
}

export async function getPublicVoting(req, res, next) {
  try {
    const voting = await votingsCollection().findOne({
      _id: objectid(req.swagger.params.voting_id.value),
    });
    if (!voting) {
      throw new RESTErrorNotFound('VOTING_NOT_FOUND');
    }
    res.json(voting);
  } catch (e) {
    next(e);
  }
}

export async function registerVote(req, res, next) {
  try {
    const voting = await votingsCollection().findOne({
      _id: objectid(req.swagger.params.voting_id.value),
    });
    if (!voting) {
      throw new RESTErrorNotFound('VOTING_NOT_FOUND');
    }
    // porovname datumy
    const now = new Date();
    if (voting.dateFrom > now || now > voting.dateTo) {
      throw new RESTErrorForbidden('VOTING_REJECTED');
    }

    // odpoved ktoru poslal musi existovat pri danej otazke
    const data = req.swagger.params.data.value;
    const answerIds = voting.answers.map(answer => {
      return answer._id;
    });
    data.answerIds.forEach(answer => {
      if (answerIds.indexOf(answer) === -1) {
        throw new RESTErrorConflict('ANSWER_NOT_FOUND');
      }
    });

    await votersCollection().insert({
      votingId: voting._id,
      answerIds: data.answerIds,
      dateTime: new Date(),
    });

    const promises = [];
    for (const answer of data.answerIds) {
      promises.push(
        votingsCollection().updateOne(
          {
            _id: voting._id,
            'answers._id': answer,
          },
          {
            $inc: {
              'answers.$.totalVotes': 1,
            },
          },
        ),
      );
    }

    await Promise.all(promises);

    // vratime updatnuty voting
    const updatedVoting = await votingsCollection().findOne({
      _id: objectid(req.swagger.params.voting_id.value),
    });
    res.json(updatedVoting);
  } catch (e) {
    next(e);
  }
}
