const random  = require('../utils').random;
const range   = require('../utils').range;
const logger  = require('../utils').logger;
const andify  = require('../utils').andify;
const db      = require('./db').connection;
const moment  = require('moment');
const Promise = require('bluebird');

module.exports = {
  add(data) {
    return new Promise((resolve, reject) => {
      let self = this;
      data.ref = this.genRandomRef();

      db.query('INSERT INTO `list` SET ?', data, (err, result) => {
        err ? reject(err) : resolve({id: result.insertId});
      });
    });
  },
  remove(cond) {
    return new Promise((resolve, reject) => {
      db.query('DELETE FROM `list` WHERE ?', cond, (err, data) => {
        err ? reject(err) : resolve();
      });
    });
  },
  genRandomRef() {
    let ref, dup;

    do {
      dup = false;
      ref = random(5, 8);

      this.refExists(ref).then(exists => {
        dup = exists;
      });
    } while(dup);

    return ref;
  },
  refExists(ref) {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM `list` WHERE ?', {ref}, (err, data) => {
        err ? reject(err) : resolve(data.length !== 0);
      });
    });
  },
  getCond(cond) {
    return new Promise((resolve, reject) => {
      cond = andify(cond);

      if (cond.query !== undefined) {
        db.query('SELECT * FROM `list` WHERE ' + cond.query, (err, data) => {
          if (err) reject(err);
          else if (data.length === 0) resolve(null);
          else if (data.length === 1) resolve(data[0]);
          else resolve(data);
        });
      } else {
        db.query('SELECT * FROM `list` WHERE ?', cond, (err, data) => {
          if (err) reject(err);
          else if (data.length === 0) resolve(null);
          else if (data.length === 1) resolve(data[0]);
          else resolve(data);
        });
      }
    });
  },
  getLists(owner) {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM `list` WHERE ? ORDER BY `modified` DESC', {owner}, (err, data) => {
        if (err) reject(err);
        else if (data.length === 0) resolve(null);
        else resolve(data);
      });
    });
  },
  update(vals, ref) {
    return new Promise((resolve, reject) => {
      db.query('UPDATE `list` SET ? WHERE ?', [vals, {ref}], (err, result) => {
        this.modified(ref).then(() => {
          resolve({err: err, result: result});
        });
      });
    });
  },
  modified(ref) {
    return new Promise((resolve, reject) => {
      db.query('UPDATE `list` SET ? WHERE ?', [{modified: moment(new Date().getTime()).format("YYYY-MM-DD HH:mm:ss")}, {ref}], (err, result) => {
        resolve({err: err, result: result});
      });
    });
  }
};
